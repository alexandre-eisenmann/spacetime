import {useEffect,useMemo,useState} from 'react';
import type {HistoricalDataset} from './domain/schema';
import {mergeTiles,tilesFor,type Tile,type TileIndex} from './domain/timeline';
import {team,teamFacet} from './data/team';
import {asset} from './asset';

const indexRequest:{current?:Promise<TileIndex>}={};
const tileRequests=new Map<string,Promise<Tile>>();
const getJson=<T,>(url:string)=>fetch(asset(url)).then(r=>{if(!r.ok)throw new Error(`${url}: ${r.status}`);return r.json() as Promise<T>});

// Loads people tiles around the visible window, like map tiles around the viewport. Loaded tiles stay cached.
export function useTimelineTiles(base:HistoricalDataset,window:[number,number]){
 const [index,setIndex]=useState<TileIndex>();
 const [loaded,setLoaded]=useState<Record<string,Tile>>({});
 const [error,setError]=useState('');
 useEffect(()=>{(indexRequest.current??=getJson<TileIndex>('/data/timeline/index.json')).then(setIndex,()=>setError('Timeline people could not be loaded.'))},[]);
 const wanted=index?tilesFor(index,window):[];
 const key=wanted.map(t=>t.url).join();
 useEffect(()=>{
  let live=true;
  for(const t of wanted){
   if(loaded[t.url])continue;
   if(!tileRequests.has(t.url))tileRequests.set(t.url,getJson<Tile>(t.url));
   tileRequests.get(t.url)!.then(tile=>{if(live)setLoaded(l=>l[t.url]?l:{...l,[t.url]:tile})},()=>setError('Some timeline people could not be loaded.'));
  }
  return ()=>{live=false};
 },[key]);
 const merged=useMemo(()=>mergeTiles(base,[team,...Object.values(loaded)]),[base,loaded]);
 const facets=useMemo(()=>[teamFacet,...index?.facets??[]],[index]);
 const colors=useMemo(()=>Object.fromEntries(Object.entries(merged.layout).map(([id,l])=>[id,facets.find(f=>f.id===l.facets[0])?.color??'#8c8963'])),[merged,facets]);
 const pending=wanted.filter(t=>!loaded[t.url]);
 return {...merged,facets,colors,pending,error};
}
