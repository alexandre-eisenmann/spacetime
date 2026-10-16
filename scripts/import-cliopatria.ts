// Extracts selected polities from a Cliopatria release into src/data/cliopatria.json.
// Usage: pnpm data:cliopatria [path-to-cliopatria.geojson]
// Geometry is kept as published; only coordinate precision is reduced.
import {readFileSync,writeFileSync} from 'node:fs';
import {validRing} from '../src/domain/geometry';

const release='v0.2.1';
const input=process.argv[2]??'data-raw/cliopatria_polities_only_v021.geojson';
const polities=['Achaemenid Empire','Macedonian Empire','Roman Republic','Roman Empire'];
const window=[-560,140];
const precision=1e4;

type Ring=number[][];
// Cliopatria writes BCE years as negative integers and uses 0 for 1 BCE; internal years are astronomical.
const astronomical=(year:number)=>year<0?year+1:year;
const roundRing=(ring:Ring):Ring=>{
 const out:Ring=[];
 for(const [x,y] of ring){const p=[Math.round(x*precision)/precision,Math.round(y*precision)/precision];const last=out.at(-1);if(!last||last[0]!==p[0]||last[1]!==p[1])out.push(p)}
 if(out.length>1&&(out[0][0]!==out.at(-1)![0]||out[0][1]!==out.at(-1)![1]))out.push(out[0]);
 return out;
};
const ringOf=(ring:Ring)=>{const rounded=roundRing(ring);if(validRing(rounded))return rounded;if(validRing(ring))return ring;throw new Error('Invalid ring in source geometry')};

const source=JSON.parse(readFileSync(input,'utf8'));
const rows=source.features
 .filter((f:any)=>polities.includes(f.properties.Name)&&f.properties.ToYear>=window[0]&&f.properties.FromYear<=window[1])
 .map((f:any)=>{
  const p=f.properties;
  const polygons:Ring[][]=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  return {name:p.Name,from:astronomical(p.FromYear),to:astronomical(p.ToYear),sourceFrom:p.FromYear,sourceTo:p.ToYear,areaKm2:Math.round(p.Area),wikipedia:p.Wikipedia||undefined,wikidata:p.Wikidata||undefined,seshatId:p.SeshatID||undefined,geometry:{type:'MultiPolygon',coordinates:polygons.map(rings=>rings.map(ringOf))}};
 })
 .sort((a:any,b:any)=>a.name.localeCompare(b.name)||a.from-b.from);

writeFileSync('src/data/cliopatria.json',JSON.stringify({release,input:input.split('/').at(-1),polities,rows}));
console.log(`Wrote ${rows.length} rows for ${polities.join(', ')}`);
