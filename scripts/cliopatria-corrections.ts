// Editorial corrections to Cliopatria rows that contradict the historical record. Every import applies them first,
// so the world map, the story polygons and the polity catalogue always agree.
// A correction never edits geometry: it renames, re-dates, regroups or splits a published row, and cites its evidence.
// Years are Cliopatria's own (negative = BCE, as published), matched exactly so a new release fails loudly.
type Props={Name:string;FromYear:number;ToYear:number;Area:number;Type:string;Wikipedia?:string;Wikidata?:string;Components?:string;MemberOf?:string;Correction?:string;[key:string]:unknown};
type Feature={type:'Feature';properties:Props;geometry:{type:'Polygon'|'MultiPolygon';coordinates:any}};
type Correction={match:Pick<Props,'Name'|'FromYear'|'ToYear'>;into:Partial<Props>[];note:string;evidence:string};

const macedon={Name:'Macedonian Empire',Wikipedia:'Macedonia (ancient kingdom)',Wikidata:'Q83958'};
const alexanderTimeline='https://www.worldhistory.org/timeline/Alexander_the_Great/';
export const corrections:Correction[]=[
 {match:{Name:'Ptolemaic Kingdom',FromYear:-331,ToYear:-327},into:[macedon],evidence:alexanderTimeline,
  note:'Relabelled from Ptolemaic Kingdom: these are Alexander’s conquests; Ptolemy ruled Egypt only from 323 BCE.'},
 {match:{Name:'Ptolemaic Kingdom',FromYear:-326,ToYear:-324},into:[macedon],evidence:alexanderTimeline,
  note:'Relabelled from Ptolemaic Kingdom: this is Alexander’s whole empire; Ptolemy ruled Egypt only from 323 BCE.'},
 {match:{Name:'Achaemenid Empire',FromYear:-331,ToYear:-327},into:[{ToYear:-330},{...macedon,FromYear:-329}],evidence:'https://www.worldhistory.org/Achaemenid_Empire/',
  note:'Achaemenid rule ends with Darius III’s death in 330 BCE; Alexander holds these lands from 329 BCE.'},
 {match:{Name:'(Macedonian Empire)',FromYear:-318,ToYear:-316},into:[{Components:'Macedonian Empire;Polyperchon'}],evidence:'https://en.wikipedia.org/wiki/Polyperchon',
  note:'Polyperchon governs Macedon as regent of Alexander’s empire, so he is listed with it.'},
 {match:{Name:'Polyperchon',FromYear:-318,ToYear:-316},into:[{MemberOf:'(Macedonian Empire)'}],evidence:'https://en.wikipedia.org/wiki/Polyperchon',
  note:'Polyperchon governs Macedon as regent of Alexander’s empire, so he is listed with it.'}
];

const parts=(f:Feature)=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
// Rows of one name never overlap in Cliopatria. Corrections can make them overlap, so overlapping rows are cut at
// every boundary and each stretch becomes one row: its pieces together, named after the largest.
function mergeOverlaps(features:Feature[]){
 const byName=new Map<string,Feature[]>();
 for(const f of features){const list=byName.get(f.properties.Name)??[];list.push(f);byName.set(f.properties.Name,list)}
 const merged=new Map<string,Feature[]>();
 for(const [name,list] of byName){
  const sorted=[...list].sort((a,b)=>a.properties.FromYear-b.properties.FromYear);
  if(!sorted.every((f,i)=>i===0||f.properties.FromYear>sorted[i-1].properties.ToYear))merged.set(name,merge(list));
 }
 return features.flatMap(f=>{const m=merged.get(f.properties.Name);if(!m)return [f];merged.set(f.properties.Name,[]);return m});
}
function merge(list:Feature[]):Feature[]{
 const cuts=[...new Set(list.flatMap(f=>[f.properties.FromYear,f.properties.ToYear+1]))].sort((a,b)=>a-b);
 return cuts.slice(0,-1).flatMap((from,i)=>{
  const to=cuts[i+1]-1,cover=list.filter(f=>f.properties.FromYear<=from&&to<=f.properties.ToYear);
  if(!cover.length)return [];
  const largest=cover.reduce((a,b)=>b.properties.Area>a.properties.Area?b:a);
  const notes=[...new Set(cover.map(f=>f.properties.Correction).filter(Boolean))];
  return [{type:'Feature',properties:{...largest.properties,FromYear:from,ToYear:to,Area:cover.reduce((s,f)=>s+f.properties.Area,0),Correction:notes.join(' ')||undefined},geometry:cover.length===1?largest.geometry:{type:'MultiPolygon',coordinates:cover.flatMap(parts)}}];
 });
}

export function correctCliopatria<T>(features:T[]):T[]{
 const list=features as unknown as Feature[];
 const out=list.flatMap(f=>{
  const c=corrections.find(c=>c.match.Name===f.properties.Name&&c.match.FromYear===f.properties.FromYear&&c.match.ToYear===f.properties.ToYear);
  return c?c.into.map(o=>({...f,properties:{...f.properties,...o,Correction:c.note}})):[f];
 });
 for(const c of corrections)if(!list.some(f=>f.properties.Name===c.match.Name&&f.properties.FromYear===c.match.FromYear&&f.properties.ToYear===c.match.ToYear))throw new Error(`Cliopatria correction matches no row: ${c.match.Name} ${c.match.FromYear}–${c.match.ToYear}`);
 return mergeOverlaps(out) as unknown as T[];
}
