// Builds lazily loaded timeline tiles of people's lifetimes.
// Who: Roman emperors and presidents of Brazil from Wikidata; from 5000 BCE, the most notable people per century from Pantheon (HPI ranking).
// Mathematicians: every Pantheon mathematician with HPI ≥ 70, any century, plus Thales, Pythagoras, Hipparchus and Eratosthenes.
// Facets: Pantheon's occupation plus Wikidata occupations (P106). A person keeps every matching facet.
// When: birth/death always from Wikidata best-rank statements.
// Usage: pnpm data:people   (network access to query.wikidata.org and api.pantheon.world required)
import {mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {loadDataset} from '../src/domain/schema';
import {packLanes,type TileIndex,type Tile,type PersonEntry} from '../src/domain/timeline';
const tileSize=100,outDir='public/data/timeline',today=new Date(),accessed=today.toISOString().slice(0,10),thisYear=today.getUTCFullYear();
const facets=[
 {id:'mathematician',label:'Mathematician',color:'#3e5f8a'},
 {id:'philosopher',label:'Philosopher',color:'#5b6f9a'},
 {id:'writer',label:'Writer',color:'#6d5a8a'},
 {id:'scientist',label:'Scientist',color:'#4f7f8f'},
 {id:'explorer',label:'Explorer',color:'#3f7a72'},
 {id:'ruler',label:'Ruler',color:'#8a5a7a'},
 {id:'military',label:'Military',color:'#9b5c62'},
 {id:'religious',label:'Religious figure',color:'#7a7350'},
 {id:'artist',label:'Artist',color:'#b07c4f'},
 {id:'musician',label:'Musician',color:'#a15d68'},
 {id:'public',label:'Public life',color:'#7d8a5a'},
 {id:'sport',label:'Sport',color:'#5e8a6e'}
];
const facetIds=new Set(facets.map(f=>f.id));
const facetLabel=new Map(facets.map(f=>[f.id,f.label]));
// Finer than Pantheon's domain, so a physicist who also did mathematics keeps both.
const namedFacet:Record<string,string>={
 mathematician:'mathematician',philosopher:'philosopher',writer:'writer',poet:'writer',playwright:'writer',novelist:'writer',
 composer:'musician',singer:'musician',musician:'musician',
 painter:'artist',sculptor:'artist',architect:'artist',actor:'artist','film director':'artist',artist:'artist',designer:'artist','fashion designer':'artist',comedian:'artist',producer:'artist',
 politician:'ruler',nobleman:'ruler',diplomat:'public',
 'military personnel':'military',
 'religious figure':'religious',
 explorer:'explorer',geographer:'explorer',
 physicist:'scientist',astronomer:'scientist',chemist:'scientist',biologist:'scientist',physician:'scientist',inventor:'scientist','computer scientist':'scientist',astronaut:'scientist',psychologist:'scientist',sociologist:'scientist',
 'soccer player':'sport','tennis player':'sport',boxer:'sport',athlete:'sport','racing driver':'sport',
 'social activist':'public',businessperson:'public',lawyer:'public',companion:'public',economist:'public',historian:'writer',linguist:'writer'
};
const facetOfDomain:Record<string,string>={'INSTITUTIONS/GOVERNMENT':'ruler','INSTITUTIONS/MILITARY':'military','INSTITUTIONS/RELIGION':'religious','HUMANITIES':'writer','SCIENCE & TECHNOLOGY':'scientist','EXPLORATION':'explorer','ARTS':'artist','BUSINESS & LAW':'public','PUBLIC FIGURE':'public','SPORTS':'sport'};
function facetOf(name:string){
 const k=name.toLowerCase();
 if(namedFacet[k])return namedFacet[k];
 if(/\bmathematic/.test(k))return 'mathematician';
 if(/\bphilosoph/.test(k))return 'philosopher';
 if(/\b(poet|playwright|novelist|dramatist|essayist)\b/.test(k))return 'writer';
 if(/\b(composer|singer)\b/.test(k)||/\bmusic/.test(k))return 'musician';
 if(/\b(king|queen|emperor|monarch|sultan|pharaoh|caliph)\b/.test(k))return 'ruler';
 if(/\b(priest|pope|bishop|rabbi|imam|theolog)\b/.test(k))return 'religious';
 if(/\b(general|admiral|soldier)\b/.test(k))return 'military';
 return undefined;
}
// Notable mathematicians in every century, not only those who also clear the general per-century quota.
const mathematicianHpi=70;
// Pantheon files these four outside MATHEMATICIAN; they open the same lineage (philosopher, philosopher, astronomer, geographer).
const classicalMathematicians=[30072,23275,13600,46117]; // Thales of Miletus, Pythagoras, Hipparchus, Eratosthenes
const firstCentury=-5000;
// People per birth century; recent centuries are denser.
const quota=(century:number)=>century<1000?25:century<1400?35:century<1700?60:century<1800?90:century<1900?140:century<2000?180:15;

async function getJson(url:string,init?:RequestInit){
 for(let attempt=0;;attempt++){
  const res=await fetch(url,init);
  if(res.ok)return res.json();
  if(attempt>=3)throw new Error(`${url.slice(0,120)}: ${res.status} ${await res.text()}`);
  await new Promise(r=>setTimeout(r,2000*(attempt+1)));
 }
}
const sparql=async(query:string)=>(await getJson('https://query.wikidata.org/sparql?query='+encodeURIComponent(query),{headers:{Accept:'application/sparql-results+json','User-Agent':'spacetime-atlas/0.1 (timeline import)'}})).results.bindings as Record<string,{value:string}>[];
const pantheon=(path:string)=>getJson(`https://api.pantheon.world/${path}`);
const qid=(uri:string)=>uri.split('/').pop()!;
// WDQS emits XSD dates (astronomical years: 0000 = 1 BCE), matching the internal numbering.
const yearOf=(iso:string)=>Number(iso.match(/^(-?\d+)-/)![1]);
const fmt=(y:number)=>y<=0?`${1-y} BCE`:`${y}`;
const title=(s:string)=>s.toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase());

type Role={occupation:string;subtitle:string;score:number;living?:boolean;years?:[number|null,number|null];aside?:string;extra?:string[];facets?:string[];office?:string};
const roles=new Map<string,Role>();

const emperors=await sparql(`SELECT ?p ?start ?end ?links WHERE {
 VALUES ?position {wd:Q842606 wd:Q111841409}
 ?p p:P39 ?st; wikibase:sitelinks ?links. ?st ps:P39 ?position; pq:P580 ?start. OPTIONAL{?st pq:P582 ?end}
 FILTER(YEAR(?start)<=476) }`);
const reigns=new Map<string,{span:[number,number];links:number}>();
for(const b of emperors){const id=qid(b.p.value),s=yearOf(b.start.value),e=b.end?yearOf(b.end.value):s;const r=reigns.get(id);reigns.set(id,{span:r?[Math.min(r.span[0],s),Math.max(r.span[1],e)]:[s,e],links:Number(b.links.value)})}
for(const [id,{span:[s,e],links}] of reigns){const office=`Emperor ${fmt(s)}${e!==s?`–${fmt(e)}`:''}`;roles.set(id,{occupation:'',subtitle:office,office,score:Math.min(90,Math.round((45+Math.log2(links+1)*7)*10)/10),extra:['ruler']})}

const occupations:{occupation:string;domain:string;industry:string}[]=await pantheon('occupation?select=occupation,domain,industry');
const domainOf=new Map(occupations.map(o=>[o.occupation,o.domain==='INSTITUTIONS'?`${o.domain}/${o.industry}`:o.domain]));
type Ranked={id:number;hpi:number;occupation:string;birthyear:number|null;deathyear:number|null};
let pantheonCount=0;
async function addRanked(ranked:Ranked[],asideFor:(r:Ranked)=>string|undefined=()=>undefined){
 const added:string[]=[];
 if(!ranked.length)return added;
 const people:{id:number;wd_id:string|null;alive:boolean}[]=await pantheon(`person?select=id,wd_id,alive&id=in.(${[...new Set(ranked.map(r=>r.id))].join(',')})`);
 const byId=new Map(people.map(p=>[p.id,p]));
 for(const r of ranked){
  const p=byId.get(r.id),extra=asideFor(r)?['mathematician']:undefined;
  if(!p?.wd_id||roles.has(p.wd_id))continue;
  if(!facetOf(r.occupation)&&!facetOfDomain[domainOf.get(r.occupation)??'']&&!extra)continue;
  roles.set(p.wd_id,{occupation:r.occupation,subtitle:title(r.occupation),score:r.hpi,living:p.alive,years:[r.birthyear,r.deathyear],aside:asideFor(r),extra});pantheonCount++;added.push(p.wd_id);
 }
 return added;
}
// Before the per-century pass, which would otherwise take them first without the mathematician facet.
await addRanked(await pantheon(`person_ranks?select=id,hpi,occupation,birthyear,deathyear&id=in.(${classicalMathematicians.join(',')})`),r=>` Pantheon lists the occupation as ${title(r.occupation).toLowerCase()}; included here with the mathematicians.`);
for(let century=firstCentury;century<=Math.floor(thisYear/100)*100;century+=100)
 await addRanked(await pantheon(`person_ranks?select=id,hpi,occupation,birthyear,deathyear&birthyear=gte.${century}&birthyear=lt.${century+100}&order=hpi.desc&limit=${quota(century)}`));
await addRanked(await pantheon(`person_ranks?select=id,hpi,occupation,birthyear,deathyear&occupation=eq.MATHEMATICIAN&hpi=gte.${mathematicianHpi}&order=hpi.desc&limit=1000`));

// Every president of Brazil, scored by Pantheon's HPI like everyone else; most fall outside the per-century quota.
const presidentOfBrazil='Q5176750';
const presidencies=await sparql(`SELECT ?p ?start ?end WHERE {
 ?p p:P39 ?st; wdt:P31 wd:Q5. ?st ps:P39 wd:${presidentOfBrazil}; pq:P580 ?start. OPTIONAL{?st pq:P582 ?end} }`);
const terms=new Map<string,[number,number|null][]>();
for(const b of presidencies){const id=qid(b.p.value),list=terms.get(id)??[];list.push([yearOf(b.start.value),b.end?yearOf(b.end.value):null]);terms.set(id,list)}
const presidentsInPantheon:{id:number}[]=await pantheon(`person?select=id&wd_id=in.(${[...terms.keys()].join(',')})`);
if(presidentsInPantheon.length)await addRanked(await pantheon(`person_ranks?select=id,hpi,occupation,birthyear,deathyear&id=in.(${presidentsInPantheon.map(p=>p.id).join(',')})`));
// Below every Pantheon-ranked president, for anyone Pantheon has not indexed yet.
const unrankedPresidentScore=55;
for(const [id,list] of terms){
 // Wikidata often splits one presidency into several statements; join terms that touch.
 const merged:[number,number|null][]=[];
 for(const [s,e] of list.sort((a,b)=>a[0]-b[0])){const last=merged.at(-1);if(last&&last[1]!==null&&s<=last[1]+1)last[1]=e===null?null:Math.max(last[1],e);else merged.push([s,e])}
 const office=`President of Brazil ${merged.map(([s,e])=>e===null?`since ${fmt(s)}`:`${fmt(s)}${e!==s?`–${fmt(e)}`:''}`).join(', ')}`;
 const known=roles.get(id);
 if(known){known.office=known.office?`${known.office}; ${office}`:office;known.extra=[...new Set([...(known.extra??[]),'ruler'])];continue}
 roles.set(id,{occupation:'',subtitle:office,office,score:unrankedPresidentScore,living:true,extra:['ruler']});
}

type DatePart={year:number;precision:number;circa:boolean};
const details=new Map<string,{label:string;birth:DatePart[];death:DatePart[]}>();
const wikiOcc=new Map<string,string[]>();
// Place of birth (P19, best rank) with its coordinates (P625); the search jumps the map there.
const birthplaces=new Map<string,{name:string;position:[number,number]}>();
const ids=[...roles.keys()];
for(let i=0;i<ids.length;i+=80){
 const values=`VALUES ?p {${ids.slice(i,i+80).map(id=>`wd:${id}`).join(' ')}}`;
 const rows=await sparql(`SELECT ?p ?label ?prop ?t ?prec ?circa WHERE {
  ${values}
  OPTIONAL{?p rdfs:label ?en FILTER(LANG(?en)="en")} OPTIONAL{?p rdfs:label ?mul FILTER(LANG(?mul)="mul")}
  BIND(COALESCE(?en,?mul) AS ?label)
  VALUES (?prop ?claim ?value) {(1 p:P569 psv:P569) (2 p:P570 psv:P570)}
  ?p ?claim ?st. ?st a wikibase:BestRank; ?value [wikibase:timeValue ?t; wikibase:timePrecision ?prec].
  OPTIONAL{?st pq:P1480 ?circa} }`);
 for(const b of rows){
  const id=qid(b.p.value),d=details.get(id)??{label:b.label?.value??id,birth:[],death:[]};
  (b.prop.value==='1'?d.birth:d.death).push({year:yearOf(b.t.value),precision:Number(b.prec.value),circa:!!b.circa});
  details.set(id,d);
 }
 const occ=await sparql(`SELECT ?p ?occ WHERE { ${values} ?p p:P106 ?st. ?st a wikibase:BestRank; ps:P106 ?item. ?item rdfs:label ?occ FILTER(LANG(?occ)="en") }`);
 for(const b of occ){const id=qid(b.p.value),list=wikiOcc.get(id)??[];if(b.occ&&!list.includes(b.occ.value))list.push(b.occ.value);wikiOcc.set(id,list)}
 const born=await sparql(`SELECT ?p ?place ?name ?coord WHERE { ${values} ?p p:P19 ?st. ?st a wikibase:BestRank; ps:P19 ?place. ?place wdt:P625 ?coord.
  OPTIONAL{?place rdfs:label ?en FILTER(LANG(?en)="en")} OPTIONAL{?place rdfs:label ?mul FILTER(LANG(?mul)="mul")} BIND(COALESCE(?en,?mul) AS ?name) }`);
 for(const b of born){
  const id=qid(b.p.value),m=b.coord.value.match(/^Point\((-?[\d.]+) (-?[\d.]+)\)$/);
  if(!m||birthplaces.has(id))continue;
  birthplaces.set(id,{name:b.name?.value??qid(b.place.value),position:[Math.round(Number(m[1])*100)/100,Math.round(Number(m[2])*100)/100]});
 }
}
for(const [id,role] of roles){
 const found:string[]=[];
 const add=(f?:string)=>{if(f&&facetIds.has(f)&&!found.includes(f))found.push(f)};
 for(const f of role.extra??[])add(f);
 add(facetOf(role.occupation)??facetOfDomain[domainOf.get(role.occupation)??'']);
 for(const label of wikiOcc.get(id)??[])add(facetOf(label));
 if(!found.length)add('public');
 role.facets=found;
}

// Year precision is kept; decade precision becomes a ten-year range; coarser or conflicting values are marked.
function toDate(parts:DatePart[]){
 const usable=parts.filter(p=>p.precision>=8);
 if(!usable.length)return undefined;
 const lo=Math.min(...usable.map(p=>p.precision===8?Math.floor(p.year/10)*10:p.year));
 const hi=Math.max(...usable.map(p=>p.precision===8?Math.floor(p.year/10)*10+9:p.year));
 const certainty=new Set(usable.map(p=>p.year)).size>1?'disputed':usable.some(p=>p.circa||p.precision===8)?'approximate':'exact';
 return {earliest:lo,latest:hi,precision:'year' as const,certainty:certainty as 'exact'|'approximate'|'disputed'};
}

const sources=[
 {id:'source-wikidata',title:'Wikidata — birth (P569), death (P570) and occupation (P106) statements',url:'https://www.wikidata.org/',accessed,licenseNote:'CC0 1.0. Best-rank statements only; precision and “circa” qualifiers are preserved as date ranges and certainty. Occupations become facets.'},
 {id:'source-pantheon',title:'Pantheon — Historical Popularity Index and occupations',url:'https://pantheon.world/',accessed,licenseNote:'CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Used to select the most notable people per birth century from 5000 BCE, every mathematician with HPI ≥ 70, Thales, Pythagoras, Hipparchus and Eratosthenes, and to rank the presidents of Brazil; the generated timeline tiles are shared under the same licence.'}
];
const people:{span:any;entity:any;role:Role}[]=[],skipped:string[]=[];
// Pantheon years (CE, no year zero) fill in only where Wikidata has no year- or decade-precision date.
const fallback=(year:number|null|undefined)=>year==null?undefined:{earliest:year<0?year+1:year,latest:year<0?year+1:year,precision:'year' as const,certainty:'approximate' as const};
for(const [id,role] of roles){
 const d=details.get(id);
 const wikidataBirth=d&&toDate(d.birth),birth=wikidataBirth??fallback(role.years?.[0]);
 const living=role.living&&!d?.death.length;
 const wikidataDeath=d&&toDate(d.death),death=living?{earliest:thisYear,latest:thisYear,precision:'year' as const,certainty:'exact' as const}:wikidataDeath??fallback(role.years?.[1]);
 if(!d||!birth||!death||birth.latest>death.earliest){skipped.push(`${id} ${d?.label??'?'}`);continue}
 if(id==='Q302'&&d.label==='Jesus')d.label='Jesus Christ';
 const key=id.toLowerCase(),fromPantheon=!!role.occupation,labels=(role.facets??[]).map(f=>facetLabel.get(f)??f);
 const filled=[!wikidataBirth&&'birth',!living&&!wikidataDeath&&'death'].filter(Boolean).join(' and ');
 const note=`${labels.join(', ')}. ${role.office?role.office+'. ':''}Lifetime from Wikidata ${id}${filled?` (approximate ${filled} year from Pantheon, as Wikidata gives no year-precision date)`:''}${living?`; living as of ${accessed}, so the bar runs to ${thisYear}`:''}.${fromPantheon?` Selected by Pantheon’s Historical Popularity Index (${role.score.toFixed(1)}).`:''}${role.aside??''} Bars show a lifetime, not a reign or period of influence.`;
 people.push({role:{...role,living:!!living},entity:{id:`person-${key}`,name:d.label,kind:'person'},span:{id:`life-${key}`,title:d.label,kind:'person-lifetime',interval:{start:birth,end:death,endExclusive:false},entityIds:[`person-${key}`],provenance:{sourceIds:fromPantheon?['source-wikidata','source-pantheon']:['source-wikidata'],status:'unreviewed',method:fromPantheon?'Pantheon selection, Wikidata dates':'Wikidata import',note}}});
}

const layout:Tile['lanes']={};
const check=(p:typeof people[number])=>loadDataset({schemaVersion:2,id:'dataset-check',title:'check',sources,entities:[p.entity],spans:[p.span],places:[],events:[],features:[]}).spans[0];
const spans=people.map(check);
const score=new Map(people.map(p=>[p.span.id,p.role.score]));
const lanes=packLanes(spans,3,s=>score.get(s.id)!);
for(const p of people){
 const labels=(p.role.facets??[]).map(f=>facetLabel.get(f)??f);
 layout[p.span.id]={facets:p.role.facets??[],lane:lanes[p.span.id],score:p.role.score,subtitle:p.role.office?`${p.role.office} · ${labels.join(' · ')}`:labels.join(' · '),...(p.role.living?{living:true}:{})};
}

rmSync(outDir,{recursive:true,force:true});mkdirSync(outDir,{recursive:true});
const years=people.flatMap(p=>[p.span.interval.start.earliest,p.span.interval.end.latest]);
const first=Math.floor(Math.min(...years)/tileSize)*tileSize,last=Math.max(...years);
const index:TileIndex={tileSize,bounds:[Math.min(...years),last],facets,tiles:[]};
for(let start=first;start<=last;start+=tileSize){
 const end=start+tileSize-1,name=start<0?`m${-start}`:String(start);
 const inTile=people.filter(p=>p.span.interval.start.earliest<=end&&p.span.interval.end.latest>=start);
 if(!inTile.length)continue;
 const used=new Set(inTile.flatMap(p=>p.span.provenance.sourceIds));
 const dataset={schemaVersion:2,id:`dataset-people-${name}`,title:`People alive ${fmt(start)}–${fmt(end)}`,sources:sources.filter(s=>used.has(s.id)),entities:inTile.map(p=>p.entity),spans:inTile.map(p=>p.span),places:[],events:[],features:[]};
 loadDataset(dataset);
 writeFileSync(`${outDir}/people-${name}.json`,JSON.stringify({dataset,lanes:Object.fromEntries(inTile.map(p=>[p.span.id,layout[p.span.id]]))} satisfies Tile));
 index.tiles.push({start,end,url:`/data/timeline/people-${name}.json`,count:inTile.length});
}
writeFileSync(`${outDir}/index.json`,JSON.stringify(index,null,1));
const search:PersonEntry[]=people.map(p=>{const id=p.span.id.slice('life-'.length).toUpperCase(),place=birthplaces.get(id);return {id:p.span.id,name:p.entity.name,born:p.span.interval.start.latest,died:p.span.interval.end.latest,subtitle:layout[p.span.id].subtitle,score:p.role.score,...(p.role.living?{living:true}:{}),...(place?{place:place.name,position:place.position}:{})}}).sort((a,b)=>b.score-a.score);
writeFileSync(`${outDir}/people-search.json`,JSON.stringify(search));
const counts=facets.map(f=>`${f.label} ${people.filter(p=>p.role.facets?.includes(f.id)).length}`).join(', ');
const multi=people.filter(p=>(p.role.facets?.length??0)>1).length;
console.log(`${people.length} people (${reigns.size} emperor records, ${terms.size} presidents of Brazil, ${pantheonCount} from Pantheon, ${multi} with more than one facet) in ${index.tiles.length} tiles: ${counts}`);
console.log(`${search.filter(p=>p.position).length} of ${search.length} people have a mapped birthplace`);
console.log(`Skipped ${skipped.length} without usable Wikidata dates: ${skipped.join(', ')}`);
