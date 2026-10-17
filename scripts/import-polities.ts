// Polity catalogue from a Cliopatria release, written to src/data/polities.json.
// Every map polity gets one stable ID, from its Wikidata item where that item names only this polity.
// Cliopatria's parenthesised POLITY rows group other polities (nested groups are resolved here); each member keeps
// the years it is listed in the group. RELATION rows (alliances, allegiances) are not stories' subjects and are skipped.
// Usage: pnpm data:polities [path-to-cliopatria.geojson]  (also run at the end of pnpm data:world)
import {readFileSync,writeFileSync} from 'node:fs';
import {correctCliopatria} from './cliopatria-corrections';

type Props={Name:string;FromYear:number;ToYear:number;Area:number;Type:string;Wikidata:string;Components:string};
type Range=[number,number];
const release='v0.2.1',firstYear=-5000,out='src/data/polities.json';
const astronomical=(year:number)=>year<0?year+1:year;
const slug=(s:string)=>s.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.codePointAt(0)!,16777619);return (h>>>0).toString(36).slice(0,5)};
const mostCommon=(values:string[])=>{const n=new Map<string,number>();for(const v of values)if(v)n.set(v,(n.get(v)??0)+1);return [...n].sort((a,b)=>b[1]-a[1])[0]?.[0]};
function merge(ranges:Range[]):Range[]{
 const out:Range[]=[];
 for(const [f,t] of [...ranges].sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&f<=last[1]+1)last[1]=Math.max(last[1],t);else out.push([f,t])}
 return out;
}
const intersect=(a:Range[],b:Range[])=>merge(a.flatMap(([f,t])=>b.flatMap(([g,u]):Range[]=>Math.max(f,g)<=Math.min(t,u)?[[Math.max(f,g),Math.min(t,u)]]:[])));

export function writePolities(rows:Props[]){
 const byName=new Map<string,Props[]>();
 for(const p of rows){if(!byName.has(p.Name))byName.set(p.Name,[]);byName.get(p.Name)!.push(p)}
 const leaves=[...byName].filter(([name,list])=>!name.startsWith('(')&&list.some(p=>p.ToYear>=firstYear));
 const groups=[...byName].filter(([name,list])=>name.startsWith('(')&&list[0].Type==='POLITY');
 // A Wikidata item shared by several Cliopatria names cannot identify any one of them.
 const qidUse=new Map<string,number>();
 for(const [,list] of leaves){const q=mostCommon(list.map(p=>p.Wikidata));if(q)qidUse.set(q,(qidUse.get(q)??0)+1)}
 // Names that differ only in accents or punctuation (Han, Hán) share a slug, so those carry a hash of the full name.
 const slugUse=new Map<string,number>();
 for(const [name] of leaves)slugUse.set(slug(name),(slugUse.get(slug(name))??0)+1);
 const nameKey=(name:string)=>slugUse.get(slug(name))===1?slug(name):`${slug(name)}-${hash(name)}`;
 const ids=new Set<string>();
 const claim=(id:string,name:string)=>{if(ids.has(id))throw new Error(`Duplicate polity ID ${id} for ${name}`);ids.add(id);return id};
 const polities=leaves.map(([name,list])=>{
  const q=mostCommon(list.map(p=>p.Wikidata)),peak=list.reduce((a,b)=>b.Area>a.Area?b:a);
  return {id:claim(q&&qidUse.get(q)===1?`polity-${q.toLowerCase()}`:`polity-${nameKey(name)}`,name),name,from:astronomical(Math.min(...list.map(p=>p.FromYear))),to:astronomical(Math.max(...list.map(p=>p.ToYear))),peak:astronomical(peak.FromYear),area:Math.round(peak.Area)};
 }).sort((a,b)=>b.area-a.area);
 // Direct membership per group row, then nested groups are flattened to map polities within the outer group's years.
 const direct=new Map(groups.map(([name,list])=>{
  const members=new Map<string,Range[]>();
  for(const p of list)for(const m of p.Components.split(';').map(s=>s.trim()).filter(Boolean)){if(!members.has(m))members.set(m,[]);members.get(m)!.push([astronomical(p.FromYear),astronomical(p.ToYear)])}
  return [name,members];
 }));
 const flatten=(name:string,seen:string[]):Map<string,Range[]>=>{
  const result=new Map<string,Range[]>();
  for(const [member,ranges] of direct.get(name)!){
   const inner=member.startsWith('(')&&direct.has(member)&&!seen.includes(member)?flatten(member,[...seen,member]):new Map([[member,[[-Infinity,Infinity] as Range]]]);
   for(const [leaf,innerRanges] of inner){const r=intersect(merge(ranges),innerRanges);if(r.length)result.set(leaf,merge([...(result.get(leaf)??[]),...r]))}
  }
  return result;
 };
 const leafByName=new Map(polities.map(p=>[p.name,p]));
 const groupings=groups.map(([name,list])=>{
  const members=[...flatten(name,[name])].filter(([leaf])=>leafByName.has(leaf)).map(([leaf,ranges])=>({name:leaf,ranges})).sort((a,b)=>a.ranges[0][0]-b.ranges[0][0]||a.name.localeCompare(b.name));
  const from=astronomical(Math.min(...list.map(p=>p.FromYear)));
  // A group is shown at the peak of its largest member while that member belongs to it.
  const largest=members.map(m=>leafByName.get(m.name)!).filter(p=>members.find(m=>m.name===p.name)!.ranges.some(([f,t])=>f<=p.peak&&p.peak<=t)).sort((a,b)=>b.area-a.area)[0];
  return {id:claim(`polity-group-${slug(name)}`,name),name,from,to:astronomical(Math.max(...list.map(p=>p.ToYear))),peak:largest?.peak??from,members};
 }).filter(g=>g.members.length&&g.to>=firstYear);
 writeFileSync(out,JSON.stringify({release,polities,groupings}));
 console.log(`${polities.length} polities and ${groupings.length} groupings in ${out}`);
}

if(process.argv[1]?.endsWith('import-polities.ts')){
 const input=process.argv[2]??'data-raw/cliopatria_polities_only_v021.geojson';
 writePolities(correctCliopatria<{properties:Props}>(JSON.parse(readFileSync(input,'utf8')).features).map(f=>f.properties));
}
