import {loadDataset,type HistoricalDataset} from './schema';
export type Facet={id:string;label:string;color:string};
export type TileRef={start:number;end:number;url:string;count:number};
export type TileIndex={tileSize:number;bounds:[number,number];facets:Facet[];tiles:TileRef[]};
export type PersonLane={facets:string[];lane:number;score:number;subtitle:string;living?:boolean};
export type Tile={dataset:unknown;lanes:Record<string,PersonLane>};
export type Layout=Tile['lanes'];
// One row of the people search index; position is the birthplace as [longitude, latitude].
export type PersonEntry={id:string;name:string;aliases?:string[];born:number;died:number;subtitle:string;score:number;living?:boolean;place?:string;position?:[number,number]};
type Span=HistoricalDataset['spans'][number];
export const spanStart=(s:Span)=>s.interval.start.earliest;
// The selected year sits under the timeline's centre line; near the bounds the window runs past them.
export const windowCenter=([a,b]:[number,number])=>a+Math.floor((b-a)/2);
export function centeredWindow(year:number,width:number,bounds:[number,number]):[number,number]{
 const w=Math.round(Math.max(10,Math.min(bounds[1]-bounds[0],width))),y=Math.round(Math.max(bounds[0],Math.min(bounds[1],year)));
 const s=y-Math.floor(w/2);return [s,s+w];
}
export const spanEnd=(s:Span)=>s.interval.end.latest-(s.interval.endExclusive?1:0);

// A person stays visible while any of their facets is still on.
export const hasFacet=(facets:string[]|undefined,enabled:ReadonlySet<string>)=>!!facets?.some(f=>enabled.has(f));

// Priority packing: higher-priority people take the lowest free lane, so low lanes hold the most notable
// people and the timeline can hide upper lanes when zoomed out. The all-facets packing is stored at import
// time, so those bars never jump while panning. A filtered set is packed from the people already loaded.
export function packLanes(spans:Span[],gap:number,priority:(s:Span)=>number=s=>-spanStart(s)):Record<string,number>{
 const taken:[number,number][][]=[],lanes:Record<string,number>={};
 for(const s of [...spans].sort((a,b)=>priority(b)-priority(a)||spanStart(a)-spanStart(b))){
  const a=spanStart(s),b=spanEnd(s);
  let lane=taken.findIndex(list=>list.every(([x,y])=>y+gap<a||b+gap<x));
  if(lane<0){lane=taken.length;taken.push([])}
  taken[lane].push([a,b]);lanes[s.id]=lane;
 }
 return lanes;
}

// Tiles overlapping the visible window plus one window-width of margin on each side are prefetched.
export function tilesFor(index:TileIndex,[start,end]:[number,number]){
 const margin=end-start;
 return index.tiles.filter(t=>t.end>=start-margin&&t.start<=end+margin);
}

export function mergeTiles(base:HistoricalDataset,tiles:Tile[]):{data:HistoricalDataset;layout:Layout}{
 const seen=new Set([...base.sources,...base.entities,...base.spans].map(r=>r.id));
 const extra={sources:[] as HistoricalDataset['sources'],entities:[] as HistoricalDataset['entities'],spans:[] as Span[]};
 const layout:Layout={};
 for(const tile of tiles){
  const d=loadDataset(tile.dataset);
  for(const key of ['sources','entities','spans'] as const)for(const r of d[key] as {id:string}[])if(!seen.has(r.id)){seen.add(r.id);(extra[key] as {id:string}[]).push(r)}
  Object.assign(layout,tile.lanes);
 }
 return {data:{...base,sources:[...base.sources,...extra.sources],entities:[...base.entities,...extra.entities],spans:[...base.spans,...extra.spans]},layout};
}
