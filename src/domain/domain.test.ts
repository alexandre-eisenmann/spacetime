import {test} from 'node:test';
import assert from 'node:assert/strict';
import {alexander} from '../data/alexander';
import {fromEra,formatYear,loadDataset} from './schema';
import {featuresAt,latestEvent,timeWindow} from './selectors';
import {catalog,bounds} from '../data/catalog';
const period='campaign-alexander';
const polygonIndex=catalog.features.findIndex(f=>f.geometry.type==='Polygon');
const macedonIndex=catalog.features.findIndex(f=>f.spanIds.includes(period)&&f.interval.start.latest===fromEra(336,'BCE'));
test('BCE / CE has no displayed year zero and arithmetic crosses the boundary correctly',()=>{assert.equal(fromEra(1,'BCE'),0);assert.equal(fromEra(1,'CE'),1);assert.equal(formatYear(0),'1 BCE');assert.equal(formatYear(-330),'331 BCE');assert.throws(()=>fromEra(0,'BCE'))});
test('Alexander’s span shows one Macedonian Empire shape per year, then the regents beside it, only within the campaign dates',()=>{
 for(const [year,count] of [[337,0],[336,1],[331,1],[326,1],[323,3],[322,0]])assert.equal(featuresAt(catalog,fromEra(year,'BCE'),period).features.length,count);
 for(const year of [336,331,328,325])assert.deepEqual(featuresAt(catalog,fromEra(year,'BCE'),period).features.map(f=>f.properties?.title),['Macedonian Empire']);
 assert.deepEqual(featuresAt(catalog,fromEra(323,'BCE'),period).features.map(f=>f.properties?.title).sort(),['Laomedon','Macedonian Empire','Perdiccas']);
});
test('chronology selects the latest past event',()=>{assert.equal(latestEvent(alexander,period,fromEra(336,'BCE'))?.title,'A young king');assert.equal(latestEvent(alexander,period,fromEra(335,'BCE'))?.title,'The fall of Thebes')});
test('timeline windows remain bounded and contain selected year',()=>{for(let y=-349;y<=-319;y++)for(const span of [5,10,15,20,25,30]){const [a,b]=timeWindow(y,span,[-349,-319]);assert.ok(a<=y&&b>=y&&a>=-349&&b<=-319);assert.equal(b-a,span)}});
test('data boundary rejects broken references, duplicate IDs, invalid dates and invalid coordinates',()=>{const mutations=[(d:any)=>d.events[0].placeId='missing-place',(d:any)=>d.events[0].id=d.events[1].id,(d:any)=>d.events[0].date.earliest=100,(d:any)=>d.features[polygonIndex].geometry.coordinates[0][0][0]=200,(d:any)=>d.features[polygonIndex].geometry.coordinates[0].pop(),(d:any)=>d.features[polygonIndex].provenance.sourceIds=[]];for(const mutate of mutations){const d=structuredClone(catalog);mutate(d);assert.throws(()=>loadDataset(d))}});
test('uncertainty is explicit and conservative vs possible visibility differs',()=>{const d=structuredClone(catalog);d.features[macedonIndex].interval.start={earliest:fromEra(337,'BCE'),latest:fromEra(335,'BCE'),certainty:'approximate',precision:'year'};const valid=loadDataset(d);assert.equal(featuresAt(valid,fromEra(336,'BCE'),period,'certain').features.length,0);assert.equal(featuresAt(valid,fromEra(336,'BCE'),period,'possible').features.length,1)});
test('hand-drawn schematic geometry cannot be marked reviewed',()=>{const d=structuredClone(catalog);Object.assign(d.features[polygonIndex],{relation:'campaign-extent'});Object.assign(d.features[polygonIndex].provenance,{method:'hand-drawn schematic',status:'reviewed'});assert.throws(()=>loadDataset(d))});

import {antiquity} from '../data/antiquity';
import {activeSpans,spansInWindow,combinedFeaturesAt,mergeDatasets} from './selectors';
test('Athens, Sparta, Persia and republican Rome coexist in 431 BCE; Alexander and imperial Rome do not',()=>{
 const ids=activeSpans(catalog,fromEra(431,'BCE')).map(p=>p.id).sort();
 assert.deepEqual(ids,['period-athens','period-persia','period-republic','period-sparta']);
 assert.equal(combinedFeaturesAt(catalog,fromEra(431,'BCE')).features.filter(f=>f.geometry.type==='Point').length,4);
});
test('27 BCE transition is not rendered as simultaneous Republic and Empire',()=>{
 const before=activeSpans(catalog,fromEra(28,'BCE')).map(p=>p.id),after=activeSpans(catalog,fromEra(27,'BCE')).map(p=>p.id);
 assert.ok(before.includes('period-republic')&&!before.includes('period-empire'));
 assert.ok(after.includes('period-empire')&&!after.includes('period-republic'));
 assert.equal(combinedFeaturesAt(catalog,fromEra(27,'BCE')).features.filter(f=>f.geometry.type==='Point').length,1);
});
test('campaign geometry appears only within the campaign dates',()=>{
 assert.ok(!combinedFeaturesAt(catalog,fromEra(350,'BCE')).features.some(f=>f.properties?.spanId===period));
 assert.ok(combinedFeaturesAt(catalog,fromEra(331,'BCE')).features.some(f=>f.properties?.spanId===period));
});
test('visible rows are clipped by historical dates, not forced to overlap',()=>{
 const ids=spansInWindow(catalog,0,117).map(p=>p.id);
 assert.deepEqual(ids,['period-empire']);
 assert.equal(activeSpans(catalog,139).length,0);
 assert.equal(combinedFeaturesAt(catalog,139).features.length,0);
});
test('normalization retains uncertain dates and no new territorial claims',()=>{
 const e=catalog.events.find(e=>e.id==='event-athens-treasury')!;
 assert.equal(e.date.earliest,fromEra(454,'BCE'));assert.equal(e.date.latest,fromEra(453,'BCE'));assert.equal(e.date.certainty,'approximate');
 assert.ok(antiquity.features.every(f=>f.relation==='reference-location'&&f.provenance.status==='illustrative'));
});
test('combining datasets rejects globally colliding IDs',()=>assert.throws(()=>mergeDatasets([alexander,alexander])));
test('typed spans and reference locations reject incompatible subjects or geometry',()=>{
 const badLife=structuredClone(catalog);Object.assign(badLife.spans.find(s=>s.id===period)!,{kind:'person-lifetime',entityIds:[polityEntity('Macedonian Empire').id]});assert.throws(()=>loadDataset(badLife));
 const badPoint=structuredClone(catalog);badPoint.features[0].geometry={type:'LineString',coordinates:[[0,0],[1,1]]};assert.throws(()=>loadDataset(badPoint));
});

const territorial=(year:number,span:string)=>combinedFeaturesAt(catalog,year<0?fromEra(-year,'BCE'):year).features.filter(f=>(f.geometry.type==='Polygon'||f.geometry.type==='MultiPolygon')&&f.properties?.spanId===span);
const ringArea=(r:number[][])=>Math.abs(r.slice(0,-1).reduce((a,p,i)=>a+p[0]*r[i+1][1]-r[i+1][0]*p[1],0))/2;
const footprint=(year:number,span:string)=>territorial(year,span).reduce((sum,f)=>{const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];return sum+polygons.reduce((s,[outer,...holes])=>s+ringArea(outer)-holes.reduce((h,r)=>h+ringArea(r),0),0)},0);
test('Cliopatria Rome grows across Republic and Empire, then withdraws after Trajan',()=>{
 assert.ok(footprint(-264,'period-republic')>footprint(-500,'period-republic'));
 assert.ok(footprint(-50,'period-republic')>footprint(-201,'period-republic'));
 assert.ok(footprint(116,'period-empire')>footprint(43,'period-empire'));
 assert.ok(footprint(127,'period-empire')<footprint(117,'period-empire'));
 assert.deepEqual(territorial(-29,'period-republic').map(f=>f.properties?.title),['Roman Empire']);
});
test('Greek polygons are distinct spheres and contract at historical reversals',()=>{
 assert.ok(footprint(-454,'period-athens')>footprint(-480,'period-athens'));
 assert.ok(footprint(-404,'period-athens')<footprint(-405,'period-athens'));
 assert.ok(footprint(-404,'period-sparta')>footprint(-405,'period-sparta'));
 assert.ok(footprint(-369,'period-sparta')<footprint(-370,'period-sparta'));
 assert.ok(territorial(-431,'period-athens').some(f=>f.properties?.relation==='alliance'));
});
test('Cliopatria Persia expands and contracts after losing Egypt',()=>{
 assert.ok(footprint(-525,'period-persia')>footprint(-550,'period-persia'));
 assert.ok(footprint(-404,'period-persia')<footprint(-405,'period-persia'));
});
test('imported polygons keep Cliopatria provenance; Greek sketches remain illustrative',()=>{
 const imported=catalog.features.filter(f=>f.geometry.type==='MultiPolygon');
 assert.ok(imported.length>50&&imported.every(f=>f.provenance.sourceIds.includes('source-cliopatria')&&f.provenance.status==='unreviewed'));
 assert.ok(catalog.features.filter(f=>f.geometry.type==='Polygon').every(f=>f.provenance.status==='illustrative'&&f.spanIds.some(id=>id==='period-athens'||id==='period-sparta')));
});
test('geometry boundary rejects crossing and degenerate rings',()=>{
 for(const coords of [[[0,0],[2,2],[0,2],[2,0],[0,0]],[[0,0],[1,1],[2,2],[0,0]]]){const d:any=structuredClone(catalog);d.features[polygonIndex].geometry={type:'Polygon',coordinates:[coords]};assert.throws(()=>loadDataset(d))}
});

import {readFileSync} from 'node:fs';
import {packLanes,tilesFor,mergeTiles,spanStart,spanEnd,centeredWindow,windowCenter,hasFacet,type TileIndex,type Tile,type PersonEntry} from './timeline';
const index:TileIndex=JSON.parse(readFileSync('public/data/timeline/index.json','utf8'));
const tile=(t:TileIndex['tiles'][number]):Tile=>JSON.parse(readFileSync(`public${t.url}`,'utf8'));
test('lane packing never overlaps lifetimes within a lane',()=>{
 const {data}=mergeTiles(catalog,index.tiles.map(tile));const people=data.spans.filter(s=>s.provenance.sourceIds.includes('source-wikidata'));
 const lanes=packLanes(people,3);
 for(const a of people)for(const b of people)if(a.id<b.id&&lanes[a.id]===lanes[b.id])assert.ok(spanEnd(a)+3<spanStart(b)||spanEnd(b)+3<spanStart(a),`${a.title} / ${b.title}`);
});
test('only tiles near the visible window are requested',()=>{
 const urls=tilesFor(index,[1500,1600]).map(t=>t.url);
 assert.ok(urls.includes('/data/timeline/people-1500.json')&&urls.includes('/data/timeline/people-1400.json'));
 assert.ok(!urls.some(u=>u.includes('people-0.json')||u.includes('people-300.json')));
});
test('merged tiles add each person once and keep Wikidata lifetimes',()=>{
 const {data,layout}=mergeTiles(catalog,index.tiles.map(tile));
 const ids=data.spans.map(s=>s.id);assert.equal(new Set(ids).size,ids.length);
 const augustus=data.spans.find(s=>s.title==='Augustus')!;assert.equal(formatYear(augustus.interval.start.earliest),'63 BCE');assert.equal(augustus.interval.end.latest,14);
 assert.ok(layout['life-q307'].facets.includes('scientist'));assert.ok(layout['life-q762'].facets.includes('scientist'));
 assert.ok(data.spans.filter(s=>layout[s.id]?.subtitle.startsWith('Emperor')).length>50);
});
test('most notable people take the lowest lanes',()=>{
 const {data,layout}=mergeTiles(catalog,index.tiles.map(tile));
 const people=data.spans.filter(s=>layout[s.id]);
 const lanes=packLanes(people,3,s=>layout[s.id].score);
 const top=people.reduce((a,b)=>layout[a.id].score>=layout[b.id].score?a:b);
 assert.equal(lanes[top.id],0);assert.equal(layout[top.id].lane,0);
});
test('mathematicians run from Thales through the twentieth century',()=>{
 const {data,layout}=mergeTiles(catalog,index.tiles.map(tile));
 const has=(part:string)=>data.spans.some(s=>s.title.includes(part)&&layout[s.id]?.facets.includes('mathematician'));
 for(const name of ['Thales','Pythagoras','Euclid','Apollonius','Hipparchus','Eratosthenes','Archimedes','Fermat','Pascal','Hilbert','Gödel','Noether','Grothendieck'])assert.ok(has(name),name);
 const newton=layout[data.spans.find(s=>s.title==='Isaac Newton')!.id];
 assert.ok(newton.facets.includes('scientist')&&newton.facets.includes('mathematician'));
 const thales=layout[data.spans.find(s=>s.title.includes('Thales'))!.id];
 assert.ok(thales.facets.includes('philosopher')&&thales.facets.includes('mathematician'));
 assert.equal(hasFacet(thales.facets,new Set(['mathematician'])),true);
 assert.equal(hasFacet(thales.facets,new Set(['sport'])),false);
});
test('Jesus is on the timeline as a religious figure',()=>{
 const {data,layout}=mergeTiles(catalog,index.tiles.map(tile));
 const jesus=data.spans.find(s=>s.title==='Jesus Christ');
 assert.ok(jesus);assert.ok(layout[jesus!.id].facets.includes('religious'));
 assert.ok(jesus!.interval.start.latest<=1&&jesus!.interval.end.earliest>=1&&jesus!.interval.end.latest<=40);
});
test('the most notable people of antiquity are on the timeline, not only emperors and mathematicians',()=>{
 const {data}=mergeTiles(catalog,index.tiles.map(tile));
 for(const name of ['Julius Caesar','Cleopatra','Cicero','Plato','Confucius','Hammurabi','Ramesses II'])assert.ok(data.spans.some(s=>s.title.includes(name)),name);
 assert.ok(index.bounds[0]<fromEra(2000,'BCE'));
});
test('living people run to the import year and say so',()=>{
 const {data,layout}=mergeTiles(catalog,index.tiles.map(tile));
 const living=data.spans.filter(s=>layout[s.id]?.living);
 assert.ok(living.length>10&&living.every(s=>s.provenance.note.includes('living as of')));
});

const worldIndex:{tiles:{start:number;end:number;url:string}[]}=JSON.parse(readFileSync('public/data/world/index.json','utf8'));
const worldAt=(year:number)=>{const t=worldIndex.tiles.find(t=>t.start<=year&&year<=t.end)!;return JSON.parse(readFileSync(`public${t.url}`,'utf8')).features.filter((f:any)=>f.properties.f<=year&&year<=f.properties.t).map((f:any)=>f.properties.n) as string[]};
test('world tiles cover every year from the first span to the present without gaps',()=>{
 const t=worldIndex.tiles;assert.ok(t[0].start<=bounds[0]&&t.at(-1)!.end>=2024);
 for(let i=1;i<t.length;i++)assert.equal(t[i].start,t[i-1].end+1);
});
test('world map shows Cliopatria polities under their own names at key moments',()=>{
 assert.ok(worldAt(1200).includes('Holy Roman Empire'));
 assert.ok(worldAt(1500).includes('Inca Empire')&&worldAt(1500).includes('Aztec Triple Alliance'));
 assert.ok(worldAt(1942).includes('Nazi Germany')&&worldAt(1942).includes('Empire of Japan'));
 assert.ok(worldAt(2020).includes('United States of America')&&!worldAt(2020).includes('Nazi Germany'));
 assert.ok(!worldAt(1900).some(n=>n.startsWith('(')));
});
import {chapters} from '../data/chapters';
import {polities,groupings,polityNames,polityNamesAt,politySearch,polityEntity} from '../data/polities';
const stories=mergeDatasets([catalog,chapters]);
const storySpan=(id:string)=>stories.spans.find(s=>s.id===id)!;
test('story chapters cover every year from 550 BCE to today and name real map polities',()=>{
 const spans=stories.spans.filter(s=>s.kind!=='person-lifetime');
 for(let y=fromEra(550,'BCE');y<=2026;y++)assert.ok(spans.some(s=>s.interval.start.earliest<=y&&y<=s.interval.end.latest),formatYear(y));
 const names=new Set<string>();
 for(const t of worldIndex.tiles)for(const f of JSON.parse(readFileSync(`public${t.url}`,'utf8')).features)names.add(f.properties.n);
 for(const s of spans)for(const id of s.entityIds.filter(id=>polityNames([id]).length))assert.ok(polityNames([id]).some(n=>names.has(n)),`${s.id}: ${id}`);
});
test('every polity entity has one stable ID, shared by every story about it',()=>{
 const ids=[...polities,...groupings].map(p=>p.id);assert.equal(new Set(ids).size,ids.length);
 assert.equal(polityEntity('Mongol Empire').id,'polity-q12557');
 const rome=polityEntity('Roman Empire').id;
 assert.ok(storySpan('period-empire').entityIds.includes(rome)&&storySpan('chapter-late-rome').entityIds.includes(rome));
 assert.equal(stories.entities.filter(e=>e.id===rome).length,1);
 assert.throws(()=>polityEntity('Greek Empire'));
});
test('the empires that had their own bars, and the gaps they exposed, belong to a story',()=>{
 const covered=new Set(stories.spans.flatMap(s=>polityNames(s.entityIds)));
 for(const name of ['Portuguese Empire','Spanish Empire','British Empire','British Colonial Empire','Dutch East Indies','Dutch Republic','Dutch Cape Colony','Ottoman Empire','Mongol Empire','Mughal Empire','Mali Empire','Inca Empire','Parthian Empire','Kushan Empire','Tibetan Empire','Great Seljuk Empire','Timurid Empire','Ethiopian Empire'])assert.ok(covered.has(name),name);
});
test('a grouping stands for its member polities only in the years Cliopatria lists them',()=>{
 const franks=storySpan('chapter-franks').entityIds;
 assert.deepEqual(polityNamesAt(franks,800),['Kingdom of the Franks']);
 assert.deepEqual(polityNamesAt(franks,870).sort(),['East Franks','West Franks']);
 const colonial=storySpan('chapter-colonial').entityIds;
 assert.ok(polityNamesAt(colonial,1700).includes('Dutch Cape Colony')&&!polityNamesAt(colonial,1700).includes('British Raj'));
 assert.ok(polityNamesAt(colonial,1900).includes('British Raj')&&!polityNamesAt(colonial,1900).includes('Dutch Cape Colony'));
 assert.deepEqual(polityNamesAt(storySpan('period-athens').entityIds,-430),[]);
 assert.deepEqual(polityNamesAt(storySpan('campaign-alexander').entityIds,-330),['Macedonian Empire']);
});
test('a merge accepts a shared entity only when every copy is identical',()=>{
 const renamed=structuredClone(chapters);renamed.entities.find(e=>e.id===polityEntity('Roman Empire').id)!.name='Rome';
 assert.throws(()=>mergeDatasets([catalog,renamed]));
});
import {marks,isMoment} from '../data/marks';
test('history marks are moments or periods inside the timeline bounds',()=>{
 const byTitle=(t:string)=>marks.find(m=>m.title===t)!;
 assert.equal(new Set(marks.map(m=>m.id)).size,marks.length);
 assert.ok(marks.every(m=>m.start.earliest>=bounds[0]&&m.end.latest<=bounds[1]));
 assert.ok(isMoment(byTitle('September 11 attacks'))&&byTitle('September 11 attacks').start.earliest===2001);
 const ww2=byTitle('World War II');assert.ok(!isMoment(ww2));assert.deepEqual([ww2.start.earliest,ww2.end.latest],[1939,1945]);
 assert.ok(byTitle('Plague of Justinian').end.latest<byTitle('Black Death').start.earliest);
 assert.equal(formatYear(byTitle('Battle of Marathon').start.earliest),'490 BCE');
});
test('the selected year is always under the centre of the timeline window, even at the bounds',()=>{
 for(const y of [bounds[0]-50,bounds[0],-44,1500,bounds[1],bounds[1]+9])for(const w of [5,10,99,700,bounds[1]-bounds[0],9999]){
  const win=centeredWindow(y,w,bounds);
  assert.equal(windowCenter(win),Math.max(bounds[0],Math.min(bounds[1],y)));
  assert.ok(win[1]-win[0]>=10&&win[1]-win[0]<=bounds[1]-bounds[0]);
 }
});

import {searchByName} from './search';
import {team,teamPeople} from '../data/team';
test('Alexander is an imported person like any other and the catalog has no hand-made lifetimes',()=>{
 const people:PersonEntry[]=JSON.parse(readFileSync('public/data/timeline/people-search.json','utf8'));
 const result=searchByName(people,'Alexander the great')[0];assert.equal(result?.name,'Alexander the Great');
 assert.ok(index.tiles.map(tile).some(t=>t.lanes[result.id]));
 assert.ok(!catalog.spans.some(s=>s.kind==='person-lifetime'));
});
test('team members are searchable and their search entries open their lifetimes',()=>{
 const result=searchByName(teamPeople,'victor eisenmann')[0];assert.equal(result?.name,'Victor Cardeal de Godoy Eisenmann');
 const {data,layout}=mergeTiles(catalog,[team]);
 assert.ok(data.spans.some(s=>s.id===result.id&&s.kind==='person-lifetime')&&layout[result.id].facets.includes('team'));
});
test('polities and Cliopatria groupings are searchable by name',()=>{
 assert.equal(searchByName(politySearch,'mongol')[0]?.name,'Mongol Empire');
 const british=searchByName(politySearch,'British Empire').find(p=>p.id==='polity-group-british-empire');
 assert.ok(british&&british.subtitle.includes('grouping'));
 assert.ok(politySearch.every(p=>p.from<=p.peak&&p.peak<=p.to));
});
import {playable,storyOf,storySearch,storyWindow,inStory} from '../data/stories';
import {eventsFor} from './selectors';
test('the two playable stories are Macedonian Empire and World War II',()=>{
 assert.deepEqual(playable.map(s=>s.title),['Macedonian Empire','World War II']);
 const macedon=playable[0],ww2=playable[1];
 assert.deepEqual(macedon.spanIds,['period-philip','campaign-alexander','period-successors']);
 assert.equal(ww2.spanIds[0],'conflict-ww2');
 assert.equal(storyOf('campaign-alexander')?.id,'story-macedon');
 assert.equal(storyOf('conflict-ww2')?.id,'story-ww2');
});
test('stories are searchable ahead of the matching polity, including aliases',()=>{
 assert.equal(searchByName(storySearch,'macedon')[0]?.title,'Macedonian Empire');
 assert.equal(searchByName(storySearch,'alexander')[0]?.title,'Macedonian Empire');
 assert.equal(searchByName(storySearch,'ww2')[0]?.title,'World War II');
 assert.equal(searchByName(storySearch,'second world')[0]?.title,'World War II');
});
test('a story window centred on its start keeps the whole storyline on stage',()=>{
 for(const s of playable){
  const [a,b]=storyWindow(s);
  assert.equal(windowCenter([a,b]),s.startYear);
  assert.ok(a<=s.from&&s.to<=b,s.id);
  assert.equal(b-a,s.windowYears);
 }
 const [a,b]=storyWindow(playable[0]);
 assert.ok(a<=fromEra(356,'BCE')&&fromEra(323,'BCE')<=b);
 assert.ok(inStory(playable[0],fromEra(336,'BCE'))&&inStory(playable[1],1939)&&!inStory(playable[1],1914));
});
test('each playable story has located events students can follow on the map',()=>{
 const macedon=eventsFor(catalog,playable[0].spanIds);
 const war=eventsFor(catalog,playable[1].spanIds);
 assert.ok(macedon.length>=15&&war.length>=12);
 assert.ok(macedon.some(e=>e.title==='A young king'&&e.year===fromEra(336,'BCE')));
 assert.ok(macedon.some(e=>e.title==='Philip II becomes king'));
 assert.ok(macedon.some(e=>e.title==='The battle of Ipsus'));
 assert.ok(war.some(e=>e.title==='The invasion of Poland'&&e.year===1939));
 assert.ok(war.some(e=>e.title==='Japan surrenders'));
 assert.ok(macedon.every(e=>e.position)&&war.every(e=>e.position));
});
test('corrected Cliopatria rows: Alexander’s empire grows with each conquest and Persia ends with Darius III',()=>{
 const years=[334,332,331,328,325];
 for(let i=1;i<years.length;i++)assert.ok(footprint(-years[i],'campaign-alexander')>footprint(-years[i-1],'campaign-alexander'),`${years[i]} BCE`);
 assert.ok(footprint(-328,'campaign-alexander')>3*footprint(-331,'campaign-alexander'));
 for(const year of [331,327,324]){const names=worldAt(fromEra(year,'BCE'));assert.ok(names.includes('Macedonian Empire')&&!names.includes('Ptolemaic Kingdom'),`${year} BCE`)}
 assert.ok(worldAt(fromEra(330,'BCE')).includes('Achaemenid Empire')&&!worldAt(fromEra(329,'BCE')).includes('Achaemenid Empire'));
 assert.ok(worldAt(fromEra(307,'BCE')).includes('Ptolemaic Kingdom'));
 assert.equal(polityEntity('Ptolemaic Kingdom').id,'polity-q2320005');assert.equal(polities.find(p=>p.name==='Ptolemaic Kingdom')!.from,fromEra(307,'BCE'));
 const relabelled=catalog.features.filter(f=>f.provenance.sourceIds.includes('source-cliopatria-corrections'));
 assert.ok(relabelled.length>0&&relabelled.every(f=>f.provenance.sourceIds.includes('source-cliopatria')&&f.provenance.method.includes('corrected')));
});
test('every curated span gets Cliopatria borders for the polities it is about',()=>{
 for(const [span,year] of [['period-successors',-301],['conflict-ww2',1942]] as const)assert.ok(footprint(year,span)>0,span);
 assert.deepEqual(territorial(-301,'period-successors').map(f=>f.properties?.title).sort(),['Kingdom of Lysimachus','Macedonian Empire','Ptolemaic Kingdom','Seleucid Empire']);
 assert.ok(territorial(-316,'period-successors').some(f=>f.properties?.title==='Polyperchon'));
 assert.ok(!territorial(-314,'period-successors').some(f=>f.properties?.title==='Polyperchon'));
});
