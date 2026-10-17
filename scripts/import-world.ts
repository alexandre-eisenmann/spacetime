// Builds the time-tiled world political map from a Cliopatria release.
// Usage: pnpm data:world [path-to-cliopatria.geojson]
// Every non-aggregate Cliopatria polity is kept with its published name and years; geometry is simplified for
// world-scale display (Douglas–Peucker at 0.03°, rounded to 0.01°, about 1 km), so borders are approximate
// below regional scale. Editorial corrections (scripts/cliopatria-corrections.ts) are applied first.
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import polylabel from 'polylabel';
import {writePolities} from './import-polities';
import {correctCliopatria} from './cliopatria-corrections';

const release='v0.2.1';
const input=process.argv[2]??'data-raw/cliopatria_polities_only_v021.geojson';
const outDir='public/data/world',firstYear=-5000,tolerance=0.03,precision=1e2,minArea=0.0004;
// Shorter tiles where borders change more often, so each tile stays small.
const tileSize=(year:number)=>year<1500?100:year<1750?50:10;

type Pt=number[];type Ring=Pt[];
const astronomical=(year:number)=>year<0?year+1:year;
function simplify(points:Ring,tol:number):Ring{
 if(points.length<=3)return points;
 const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;
 const stack:[number,number][]=[[0,points.length-1]];
 while(stack.length){
  const [a,b]=stack.pop()!;const [ax,ay]=points[a],[bx,by]=points[b];const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1e-12;
  let max=0,at=-1;
  for(let i=a+1;i<b;i++){const d=Math.abs(dy*points[i][0]-dx*points[i][1]+bx*ay-by*ax)/len;if(d>max){max=d;at=i}}
  if(max>tol&&at>0){keep[at]=1;stack.push([a,at],[at,b])}
 }
 return points.filter((_,i)=>keep[i]);
}
const area=(r:Ring)=>Math.abs(r.slice(0,-1).reduce((s,p,i)=>s+p[0]*r[i+1][1]-r[i+1][0]*p[1],0))/2;
// A closed ring starts and ends on the same point, so simplify its two halves separately.
function simplifyRing(ring:Ring){
 let far=0,max=-1;
 for(let i=1;i<ring.length;i++){const d=Math.hypot(ring[i][0]-ring[0][0],ring[i][1]-ring[0][1]);if(d>max){max=d;far=i}}
 return [...simplify(ring.slice(0,far+1),tolerance),...simplify(ring.slice(far),tolerance).slice(1)];
}
function cleanRing(ring:Ring):Ring|undefined{
 const out:Ring=[];
 for(const p of simplifyRing(ring)){const q=[Math.round(p[0]*precision)/precision,Math.round(p[1]*precision)/precision];const l=out.at(-1);if(!l||l[0]!==q[0]||l[1]!==q[1])out.push(q)}
 if(out.length&&(out[0][0]!==out.at(-1)![0]||out[0][1]!==out.at(-1)![1]))out.push(out[0]);
 return out.length>=4&&area(out)>=minArea?out:undefined;
}
// Stable, muted colour per polity name, so a state keeps its colour through time.
function colour(name:string){let h=2166136261;for(const c of name)h=Math.imul(h^c.charCodeAt(0),16777619);h>>>=0;return `hsl(${h%360} ${28+(h>>9)%18}% ${52+(h>>17)%14}%)`}

const source=JSON.parse(readFileSync(input,'utf8'));
const rows=correctCliopatria<any>(source.features);
const features:any[]=[];let dropped=0;
for(const f of rows){
 const p=f.properties;
 if(p.ToYear<firstYear||p.Name.startsWith('('))continue;
 const polygons=(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).map((rings:Ring[])=>{const [outer,...holes]=rings.map(cleanRing);return outer?[outer,...holes.filter(Boolean)]:undefined}).filter(Boolean) as Ring[][];
 if(!polygons.length){dropped++;continue}
 const largest=polygons.reduce((a,b)=>area(b[0])>area(a[0])?b:a);
 const [lx,ly]=polylabel(largest,0.05);
 features.push({type:'Feature',properties:{n:p.Name,f:astronomical(p.FromYear),t:astronomical(p.ToYear),a:Math.round(p.Area),w:p.Wikipedia||undefined,e:p.Correction,c:colour(p.Name),lx:Math.round(lx*100)/100,ly:Math.round(ly*100)/100},geometry:{type:'MultiPolygon',coordinates:polygons}});
}

rmSync(outDir,{recursive:true,force:true});mkdirSync(outDir,{recursive:true});
const last=Math.max(...features.map(f=>f.properties.t));
const tiles:{start:number;end:number;url:string;count:number;bytes:number}[]=[];
for(let start=Math.floor(firstYear/100)*100;start<=last;start+=tileSize(start)){
 const end=Math.min(last,start+tileSize(start)-1),name=start<0?`m${-start}`:String(start);
 const inTile=features.filter(f=>f.properties.f<=end&&f.properties.t>=start);
 const json=JSON.stringify({type:'FeatureCollection',features:inTile});
 writeFileSync(`${outDir}/world-${name}.json`,json);
 tiles.push({start,end,url:`/data/world/world-${name}.json`,count:inTile.length,bytes:json.length});
}
writeFileSync(`${outDir}/index.json`,JSON.stringify({source:`Cliopatria ${release}`,tolerance,tiles},null,1));
const total=tiles.reduce((s,t)=>s+t.bytes,0);
console.log(`${features.length} polity rows (${dropped} too small after simplification) in ${tiles.length} tiles, ${(total/1e6).toFixed(1)} MB total, largest ${(Math.max(...tiles.map(t=>t.bytes))/1e6).toFixed(2)} MB`);
writePolities(rows.map((f:any)=>f.properties));
