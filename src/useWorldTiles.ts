import {useEffect,useMemo,useRef,useState} from 'react';
import type {FeatureCollection,MultiPolygon} from 'geojson';
import {asset} from './asset';

// e: the editorial correction to Cliopatria's name or years for this row, if any.
export type PolityProps={n:string;f:number;t:number;a:number;w?:string;e?:string;c:string;lx:number;ly:number};
export type WorldTile=FeatureCollection<MultiPolygon,PolityProps>;
type WorldIndex={source:string;tiles:{start:number;end:number;url:string;count:number}[]};

let indexRequest:Promise<WorldIndex>|undefined;
const tileRequests=new Map<string,Promise<WorldTile>>();
const getJson=<T,>(url:string)=>fetch(asset(url)).then(r=>{if(!r.ok)throw new Error(`${url}: ${r.status}`);return r.json() as Promise<T>});
const request=(url:string)=>{if(!tileRequests.has(url))tileRequests.set(url,getJson<WorldTile>(url));return tileRequests.get(url)!};

// Time-tiled political map: loads the tile containing the year and prefetches its neighbours.
export function useWorldTiles(year:number){
 const [index,setIndex]=useState<WorldIndex>();
 const [tile,setTile]=useState<{url:string;data:WorldTile}>();
 const [error,setError]=useState('');
 useEffect(()=>{(indexRequest??=getJson<WorldIndex>('/data/world/index.json')).then(setIndex,()=>setError('The world political map could not be loaded.'))},[]);
 const at=index?.tiles.findIndex(t=>t.start<=year&&year<=t.end)??-1;
 const url=at>=0?index!.tiles[at].url:undefined;
 useEffect(()=>{
  if(!index||!url)return;
  let live=true;
  request(url).then(data=>{if(live)setTile({url,data})},()=>setError('Part of the world political map could not be loaded.'));
  for(const near of [index.tiles[at-1],index.tiles[at+1]])if(near)request(near.url).catch(()=>{});
  return ()=>{live=false};
 },[url]);
 // Most years share their borders with the year before, so keep the same object and let the map skip a redraw.
 const last=useRef<WorldTile>({type:'FeatureCollection',features:[]});
 const world=useMemo<WorldTile>(()=>{
  if(url&&tile?.url!==url)return last.current;
  const features=tile?tile.data.features.filter(f=>f.properties.f<=year&&year<=f.properties.t):[];
  const prev=last.current.features;
  if(features.length!==prev.length||features.some((f,i)=>f!==prev[i]))last.current={type:'FeatureCollection',features};
  return last.current;
 },[tile,url,year]);
 return {world,loading:!!url&&tile?.url!==url,error,covered:at>=0};
}
