import {useEffect,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import maplibregl from 'maplibre-gl';
import {ChevronsLeftRight,X} from 'lucide-react';
import {formatYear,fromEra} from './domain/schema';
import {bounds} from './data/catalog';
import {asset} from './asset';
import {graticule,worldLayers,addPlaceNames,addPolityLabels,fitPolityLabels} from './mapStyle';
import type {WorldTile} from './useWorldTiles';

// split: where the comparison map starts, as a fraction of the map width; 1 means closed.
export type CompareSide={split:number;map:maplibregl.Map|null};
export type CompareProps={world:WorldTile;year:number;latest:number;loading:boolean;onOpen:(open:boolean)=>void;onYear:(year:number)=>void};
const OPENED=.5,MIN=.04,CHIP_ROOM=180;
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const calendar=(y:number)=>y<=0?1-y:y;

// Before and after: a second map with the comparison year's borders follows the main camera and is uncovered from
// the right edge by dragging the divider.
export function CompareSlider({leader,side,shown,world,year,latest,loading,onOpen,onYear}:{leader:maplibregl.Map;side:{current:CompareSide};shown:number}&CompareProps){
 const [split,setSplit]=useState(1),[live,setLive]=useState(false),[ready,setReady]=useState(false);
 const host=useRef<HTMLDivElement>(null),follower=useRef<maplibregl.Map|null>(null),labels=useRef<maplibregl.Marker[]>([]);
 const at=useRef(1),glide=useRef(0),drag=useRef<{id:number;x:number;moved:boolean;closed:boolean}|null>(null);
 const open=split<1;
 const set=(s:number)=>{if(at.current>=1&&s<1){onOpen(true);setLive(true)}at.current=s;side.current.split=s;setSplit(s)};
 const slide=(to:number)=>{
  cancelAnimationFrame(glide.current);
  const from=at.current,t0=performance.now();
  const step=(t:number)=>{const k=reduceMotion()?1:Math.min(1,(t-t0)/500);set(from+(to-from)*(1-(1-k)**3));if(k<1)glide.current=requestAnimationFrame(step);else if(to>=1)onOpen(false)};
  glide.current=requestAnimationFrame(step);
 };
 useEffect(()=>()=>{cancelAnimationFrame(glide.current);side.current.split=1;onOpen(false)},[]);

 // The comparison map is only built once the reader first opens it, then kept for later comparisons.
 useEffect(()=>{
  if(!live||!host.current)return;
  const f=new maplibregl.Map({container:host.current,interactive:false,attributionControl:false,renderWorldCopies:false,center:leader.getCenter(),zoom:leader.getZoom(),style:{version:8,sources:{land:{type:'geojson',data:asset('/data/land.geojson')},grid:{type:'geojson',data:graticule()},world:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:worldLayers(false,true)}});
  follower.current=f;side.current.map=f;
  const follow=()=>f.jumpTo({center:leader.getCenter(),zoom:leader.getZoom(),bearing:leader.getBearing(),pitch:leader.getPitch(),padding:leader.getPadding()});
  const fit=()=>fitPolityLabels(labels.current,f.getZoom());
  follow();leader.on('move',follow);leader.on('zoomend',fit);
  addPlaceNames(f,['sea']);
  f.on('load',()=>setReady(true));
  return ()=>{leader.off('move',follow);leader.off('zoomend',fit);f.remove();follower.current=null;side.current.map=null;labels.current=[];setReady(false)};
 },[live,leader]);
 useEffect(()=>{
  const f=follower.current;if(!ready||!f)return;
  (f.getSource('world') as maplibregl.GeoJSONSource).setData(world);
  labels.current.forEach(l=>l.remove());labels.current=addPolityLabels(f,world);fitPolityLabels(labels.current,f.getZoom());
 },[world,ready]);

 const fraction=(clientX:number)=>{const r=leader.getContainer().getBoundingClientRect();return Math.max(MIN,Math.min(1,(clientX-r.left)/r.width))};
 const onDown=(e:PointerEvent<HTMLButtonElement>)=>{if(e.button!==0)return;cancelAnimationFrame(glide.current);try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}drag.current={id:e.pointerId,x:e.clientX,moved:false,closed:at.current>=1}};
 const onMove=(e:PointerEvent<HTMLButtonElement>)=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;if(!d.moved&&Math.abs(e.clientX-d.x)<4)return;d.moved=true;set(fraction(e.clientX))};
 // A click on the closed handle plays the reveal, even if the pointer slips a little, as it does on trackpads; a drag
 // released against the right edge closes it.
 const onUp=(e:PointerEvent<HTMLButtonElement>)=>{
  const d=drag.current;drag.current=null;if(!d||d.id!==e.pointerId)return;
  if(d.closed&&Math.abs(e.clientX-d.x)<16){slide(OPENED);return}
  if(d.moved&&at.current>.96)slide(1);
 };
 const keys=(e:KeyboardEvent)=>{
  const to={ArrowLeft:at.current-.05,ArrowRight:at.current+.05,Home:MIN,End:1,Escape:1}[e.key];if(to===undefined)return;
  e.preventDefault();cancelAnimationFrame(glide.current);const s=Math.max(MIN,Math.min(1,to));if(s>=1)slide(1);else set(s);
 };
 const left=`${split*100}%`;
 // A year chip only shows while its side of the divider is wide enough to hold it.
 const px=leader.getContainer().clientWidth,room=(fraction:number)=>fraction*px>=CHIP_ROOM;
 return <>
  {live&&<div ref={host} className="map-canvas compare-map" style={{clipPath:`inset(0 0 0 ${left})`}} aria-hidden={!open}/>}
  <div className={`compare-divider${open?'':' closed'}`} style={{left}}>
   {open&&room(split)&&<span className="compare-chip before" title="Year chosen on the timeline">{formatYear(shown)}</span>}
   {open&&room(1-split)&&<CompareYear year={year} latest={latest} loading={loading} onYear={onYear} onClose={()=>slide(1)}/>}
   <button className="compare-handle" role="slider" aria-label={`Compare ${formatYear(shown)} with ${formatYear(year)}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((1-split)*100)} aria-valuetext={open?`${Math.round((1-split)*100)}% of the map shows ${formatYear(year)}`:'Closed'} title={open?'Drag to compare':`Compare with ${formatYear(year)}`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={()=>{drag.current=null}} onKeyDown={keys}>
    <ChevronsLeftRight size={17}/>
   </button>
  </div>
 </>;
}

// Typed years are calendar years; an empty box shows the comparison year as its placeholder.
function CompareYear({year,latest,loading,onYear,onClose}:{year:number;latest:number;loading:boolean;onYear:(year:number)=>void;onClose:()=>void}){
 const [text,setText]=useState(''),[era,setEra]=useState<'BCE'|'CE'>(year<=0?'BCE':'CE');
 useEffect(()=>{if(!text)setEra(year<=0?'BCE':'CE')},[year<=0]);
 const go=(n:number,e=era)=>{if(n>=1)onYear(Math.max(bounds[0],Math.min(latest,fromEra(n,e))));setText('')};
 return <form className="compare-chip after" title={`Type a year to compare with, up to ${formatYear(latest)}`} onSubmit={e=>e.preventDefault()}>
  <input aria-label="Comparison year" inputMode="numeric" autoComplete="off" placeholder={String(calendar(year))} value={text} onChange={e=>setText(e.target.value.replace(/\D/g,'').slice(0,4))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();go(Number.parseInt(text,10))}}} onBlur={()=>{if(text)go(Number.parseInt(text,10))}}/>
  <select aria-label="Comparison era" value={era} onChange={e=>{const next=e.target.value as 'BCE'|'CE';setEra(next);go(text?Number.parseInt(text,10):calendar(year),next)}}><option>BCE</option><option>CE</option></select>
  {loading&&<small>Loading…</small>}
  <button type="button" aria-label="Close comparison" title="Close comparison" onClick={onClose}><X size={14}/></button>
 </form>;
}
