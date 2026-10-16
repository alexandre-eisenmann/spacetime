// Persia, Rome and Macedon: Cliopatria polygons, unchanged apart from rounding (see scripts/import-cliopatria.ts).
// Athens and Sparta: original low-resolution reconstructions from regional chronology; no source map tracing.
// Each patch has its own validity. Losses end patches; there is no border interpolation.
import {loadDataset,fromEra,type HistoricalDataset} from '../domain/schema';
import cliopatria from './cliopatria.json';
import {polityNames} from './polities';
const y=(n:number)=>n<0?fromEra(-n,'BCE'):n;
const date=(n:number)=>({earliest:y(n),latest:y(n),precision:'year' as const,certainty:'exact' as const});
const year=(n:number)=>({earliest:n,latest:n,precision:'year' as const,certainty:'exact' as const});
type Patch={id:string;span:string;title:string;start:number;end:number;relation:'control'|'alliance'|'influence';ring:number[][];source:string};
const patches:Patch[]=[];
function add(id:string,span:string,title:string,start:number,end:number,relation:Patch['relation'],ring:number[][],source:string){patches.push({id,span,title,start,end,relation,ring:[...ring,ring[0]],source})}
const athens='period-athens',sparta='period-sparta';
const gsource='source-territory-delian',ssource='source-territory-sparta';
const attica=[[23.1,37.6],[24.1,37.5],[24.3,38.1],[23.6,38.5],[23.1,38]];
add('athens-attica',athens,'Athenian core in Attica',-480,-404,'control',attica,gsource);
add('athens-islands',athens,'Delian League maritime alliance — island sphere',-478,-455,'alliance',[[24,36.7],[26.4,36.9],[26.8,39],[25.5,40.5],[23.8,39.3]],gsource);
add('athens-imperial-islands',athens,'Athenian-led maritime sphere',-454,-405,'influence',[[23.8,36.7],[27,36.7],[27.2,39.4],[25.7,40.8],[23.5,40],[24.2,38.5]],gsource);
add('athens-ionia',athens,'Ionian coastal allied communities — schematic corridor',-478,-405,'alliance',[[26.5,37],[27.8,37],[27.8,40],[26.3,40],[26.8,38.6]],gsource);
add('athens-thrace',athens,'Northern Aegean tribute sphere',-454,-405,'influence',[[23.6,40],[25,40.2],[27,40.5],[28.5,40.9],[27.5,41.3],[25,41.1],[23.5,40.7]],gsource);
add('sparta-laconia',sparta,'Spartan core in Laconia',-480,-362,'control',[[22.1,36.4],[23.2,36.4],[23.2,37.5],[22.5,37.8],[22,37.1]],ssource);
add('sparta-messenia',sparta,'Messenia before liberation',-480,-370,'control',[[21.3,36.7],[22.1,36.4],[22,37.1],[22.5,37.8],[21.4,37.6]],ssource);
add('sparta-allies',sparta,'Peloponnesian allies — western/central sphere, excluding Argos',-480,-372,'alliance',[[21.2,37.6],[22.4,37.7],[22.7,38.1],[22,38.3],[21.3,38.1]],ssource);
add('sparta-hegemony',sparta,'Spartan postwar influence in central Greece',-404,-372,'influence',[[22,38.3],[23.1,38],[24,38.5],[23.4,39],[22,39]],ssource);
const urls=[
[gsource,'Delian League membership and dissolution','https://www.worldhistory.org/Delian_League/'],
[ssource,'Sparta and the Peloponnesian League','https://www.worldhistory.org/Peloponnesian_League/']
];
// A span shows the extracted Cliopatria polygons of the polities it is about, while it is active.
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const sourceYear=(n:number)=>n<0?`${-n} BCE`:n===0?'0':`${n} CE`;
function cliopatriaFeatures(data:HistoricalDataset){
 return data.spans.flatMap(span=>{
  const names=polityNames(span.entityIds);
  const first=span.interval.start.latest,last=span.interval.endExclusive?span.interval.end.earliest-1:span.interval.end.earliest;
  return cliopatria.rows.filter(r=>names.includes(r.name)&&r.to>=first&&r.from<=last).map(r=>({
   id:`territory-${span.id}-${slug(r.name)}-${r.from<0?`m${-r.from}`:r.from}`,
   title:r.name,
   interval:{start:year(Math.max(r.from,first)),end:year(Math.min(r.to,last)),endExclusive:false},
   relation:'control' as const,spanIds:[span.id],entityIds:span.entityIds,
   geometry:r.geometry as {type:'MultiPolygon';coordinates:number[][][][]},
   provenance:{sourceIds:['source-cliopatria'],status:'unreviewed' as const,method:`Cliopatria ${cliopatria.release} polity polygon, imported unchanged except for rounding to 0.0001°`,note:`Cliopatria row “${r.name}”, ${sourceYear(r.sourceFrom)} – ${sourceYear(r.sourceTo)}${r.wikidata?` (Wikidata ${r.wikidata})`:''}. Shown only within this span’s dates. Borders reflect Cliopatria’s reconstruction, which samples territory at intervals.`}
  }));
 });
}
export function withTerritories(data:HistoricalDataset):HistoricalDataset{
 const sources=urls.map(([id,title,url])=>({id,title,url,accessed:'2026-10-06',licenseNote:'Chronological/regional evidence only. Original schematic coordinates, not copied or traced source maps.'}));
 const features=patches.map(p=>({id:`territory-${p.id}`,title:p.title,interval:{start:date(p.start),end:date(p.end),endExclusive:false},relation:p.relation,spanIds:[p.span],entityIds:data.spans.find(s=>s.id===p.span)!.entityIds,geometry:{type:'Polygon',coordinates:[p.ring]},provenance:{sourceIds:[p.source,'source-territory-editorial'],status:'illustrative',method:'original coarse regional reconstruction',note:'Chronology supports broad regional change, not these boundary vertices. Patchwork deliberately omits local exceptions and some holdings. Maritime alliance polygons include sea; they do not imply land sovereignty. Yearly stages are held until their next change.'}}));
 const placeBySpan:Record<string,string>={'period-athens':'place-athens','period-sparta':'place-sparta'};
 const events=patches.map(p=>({id:`event-territory-${p.id}`,title:p.title,date:date(p.start),kind:'political',spanIds:[p.span],entityIds:data.spans.find(s=>s.id===p.span)!.entityIds,placeId:placeBySpan[p.span],description:'A new approximate territorial stage is shown. This is a coarse regional reconstruction, not a precise frontier. The map event location is the chapter’s reference city.',provenance:{sourceIds:[p.source,'source-territory-editorial'],status:'illustrative',method:'editorial map-stage milestone',note:'Stage timing and extent simplify processes; reference location is not the site of every conquest.'}}));
 for(const [id,span,year,title] of [['athens-loss',athens,-404,'Athenian maritime sphere dissolves'],['sparta-loss',sparta,-369,'Messenia leaves Spartan control']] as const){events.push({id:`event-territory-${id}`,title,date:date(year),kind:'political',spanIds:[span],entityIds:data.spans.find(s=>s.id===span)!.entityIds,placeId:placeBySpan[span],description:'The territorial layer contracts at this stage. Dates are yearly editorial snapshots of a broader historical process.',provenance:{sourceIds:[span===athens?gsource:ssource,'source-territory-editorial'],status:'illustrative',method:'editorial map-stage milestone',note:'Coarse contraction snapshot; no interpolation.'}})}
 const cliopatriaSource={id:'source-cliopatria',title:`Cliopatria ${cliopatria.release} — Seshat Global History Databank`,url:'https://github.com/Seshat-Global-History-Databank/cliopatria',accessed:'2026-10-06',licenseNote:'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Polygons extracted for selected polities, clipped in time to each span and rounded to 0.0001°; otherwise unchanged.'};
 return loadDataset({...data,events:[...data.events,...events],sources:[...data.sources,...sources,cliopatriaSource,{id:'source-territory-editorial',title:'Space Time original territorial sketches',localPath:'src/data/territories.ts',accessed:'2026-10-06',licenseNote:'Original reconstruction; no third-party historical geometry copied.'}],features:[...data.features,...features,...cliopatriaFeatures(data)]});
}
