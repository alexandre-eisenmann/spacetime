import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Plus, Minus, LocateFixed, Globe2 } from 'lucide-react';
import { combinedFeaturesAt, activeSpans } from './domain/selectors';import { formatYear, type HistoricalDataset } from './domain/schema';
import { asset } from './asset';
import { arrivalBearing } from './domain/routes';
import type {WorldTile,PolityProps} from './useWorldTiles';
import type {PersonEntry} from './domain/timeline';
import {graticule,worldLayers,addPlaceNames,addPolityLabels,fitPolityLabels,polityPopup,escape} from './mapStyle';
import {CompareSlider,type CompareProps,type CompareSide} from './CompareSlider';
import 'maplibre-gl/dist/maplibre-gl.css';
// Routes: a white casing, a dark ink line (dashed at sea) and one arrowhead at the front of each route. One ink
// for every story, since a story's own colour is also the fill of the territories its routes cross. The head is
// offset back so its tip, not its centre, sits on the line's end.
const routeInk='#3d2b1f';
const now=(a:number,b:number)=>['case',['get','now'],a,b] as maplibregl.ExpressionSpecification;
const routeLayers:maplibregl.LayerSpecification[]=[
 {id:'route-casing',type:'line',source:'routes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fffdf7','line-width':now(8,5),'line-opacity':now(0.95,0.8)}},
 {id:'route-line',type:'line',source:'routes',filter:['!=',['get','mode'],'sea'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':routeInk,'line-width':now(4,2.6),'line-opacity':now(1,0.8)}},
 {id:'route-line-sea',type:'line',source:'routes',filter:['==',['get','mode'],'sea'],layout:{'line-join':'round'},paint:{'line-color':routeInk,'line-width':now(3.6,2.4),'line-opacity':now(1,0.8),'line-dasharray':[1.4,1]}},
 {id:'route-head',type:'symbol',source:'routeHeads',layout:{'icon-image':'route-arrow','icon-size':1.3,'icon-offset':[0,6],'icon-rotate':['get','bearing'],'icon-rotation-alignment':'map','icon-allow-overlap':true,'icon-ignore-placement':true},paint:{'icon-color':routeInk,'icon-halo-color':'#fffdf7','icon-halo-width':1.6}}
];
const routeLineIds=['route-line','route-line-sea'];
// A signed-distance arrowhead pointing north, so MapLibre can tint and halo it.
function arrowIcon(size=40){
 const shape=[[20,6],[33,32],[20,25],[7,32]],data=new Uint8Array(size*size*4);
 const segment=(px:number,py:number,[ax,ay]:number[],[bx,by]:number[])=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));return Math.hypot(px-ax-t*dx,py-ay-t*dy)};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const px=x+0.5,py=y+0.5;let inside=false,d=Infinity;
  for(let i=0,j=shape.length-1;i<shape.length;j=i++){const [xi,yi]=shape[i],[xj,yj]=shape[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;d=Math.min(d,segment(px,py,shape[j],shape[i]))}
  data.fill(Math.max(0,Math.min(255,Math.round(255*(0.75-(inside?-d:d)/8)))),(y*size+x)*4,(y*size+x)*4+4);
 }
 return {width:size,height:size,data};
}
// Space for the story card on the left of wide maps.
const cardPadding=()=>window.innerWidth<600?{top:60,bottom:60,left:30,right:60}:{top:65,bottom:40,left:350,right:70};
export function Atlas({data,world,compare,colors,cameraSpan,year,showRegions,showWorld,showEvents,highlight,flyTo,person,view,trail,onSelect,onSpan,onInspect}:{data:HistoricalDataset;world:WorldTile;compare:CompareProps;colors:Record<string,string>;cameraSpan:string;year:number;showRegions:boolean;showWorld:boolean;showEvents:boolean;highlight:string[];flyTo?:string;person:PersonEntry|null;view?:{key:string;center:[number,number];zoom:number};trail?:string[];onSelect:(id:string)=>void;onSpan:(id:string)=>void;onInspect:()=>void}) {
 const side=useRef<CompareSide>({split:1,map:null});
 const personMarker=useRef<maplibregl.Marker|null>(null);
 const polityLabels=useRef<maplibregl.Marker[]>([]),labelUpdate=useRef(()=>{});
 const events=data.events.map(e=>({...e,year:e.date.latest,position:data.places.find(p=>p.id===e.placeId)!.position}));
 const places=data.features.filter(f=>f.geometry.type==='Point');
 const placeMarkers=useRef<maplibregl.Marker[]>([]),regionKey=useRef(''),routeKey=useRef('');
 const spanSelection=useRef(onSpan);spanSelection.current=onSpan;
 const host=useRef<HTMLDivElement>(null), map=useRef<maplibregl.Map|null>(null), markers=useRef<maplibregl.Marker[]>([]);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[hint,setHint]=useState('');
 const inspect=useRef(onInspect);inspect.current=onInspect;
 const selection=useRef(onSelect); selection.current=onSelect;
 useEffect(()=>{
  if(!host.current)return;
  setReady(false);
  let m:maplibregl.Map;
  try {m=new maplibregl.Map({container:host.current,center:[31,37],zoom:2.8,minZoom:0.5,maxZoom:7,attributionControl:false,renderWorldCopies:false,scrollZoom:false,dragPan:false,touchZoomRotate:false,touchPitch:false,style:{version:8,sources:{land:{type:'geojson',data:asset('/data/land.geojson')},grid:{type:'geojson',data:graticule()},world:{type:'geojson',data:{type:'FeatureCollection',features:[]}},regions:{type:'geojson',data:{type:'FeatureCollection',features:[]}},routes:{type:'geojson',data:{type:'FeatureCollection',features:[]}},routeHeads:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:[...worldLayers(true),{id:'regions',type:'fill',source:'regions',paint:{'fill-color':['coalesce',['get','color'],'#ad774d'],'fill-opacity':['case',['==',['get','relation'],'control'],0.22,0.18]}},{id:'region-lines',type:'line',source:'regions',filter:['==',['get','relation'],'control'],paint:{'line-color':['get','color'],'line-opacity':0.95,'line-width':2.2}},{id:'sphere-lines',type:'line',source:'regions',filter:['!=',['get','relation'],'control'],paint:{'line-color':['get','color'],'line-opacity':0.9,'line-width':1.3,'line-dasharray':[3,2]}},...routeLayers]}});}catch{setError('This atlas needs a browser with WebGL enabled. The timeline is still available.');return;}
  map.current=m;
  // Page scrolling passes over the map until the reader clicks or taps it; leaving the map hands scrolling back to the page.
  const el=host.current,stage=el.parentElement??el,gestures=[m.scrollZoom,m.dragPan,m.touchZoomRotate,m.touchPitch];
  let engaged=false,hintTimer=0;
  const engage=(on:boolean)=>{if(engaged===on)return;engaged=on;gestures.forEach(g=>on?g.enable():g.disable());el.classList.toggle('is-engaged',on);if(on){clearTimeout(hintTimer);setHint('')}};
  const nudge=(text:string)=>{setHint(text);clearTimeout(hintTimer);hintTimer=window.setTimeout(()=>setHint(''),1600)};
  const onDown=(e:PointerEvent)=>{if(e.pointerType==='mouse')engage(true)};
  const onTap=()=>engage(true);
  const onWheel=(e:WheelEvent)=>{if(engaged)return;if(e.ctrlKey)e.preventDefault();nudge('Click the map to zoom and pan')};
  const onTouch=(e:TouchEvent)=>{if(!engaged&&e.touches.length>1)nudge('Tap the map to zoom and pan')};
  const onOutside=(e:PointerEvent)=>{if(!stage.contains(e.target as Node))engage(false)};
  const onLeave=(e:PointerEvent)=>{if(e.pointerType==='mouse'&&!e.buttons)engage(false)};
  const onRelease=(e:PointerEvent)=>{if(e.pointerType==='mouse'&&!stage.matches(':hover'))engage(false)};
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')engage(false)};
  el.addEventListener('pointerdown',onDown,true);el.addEventListener('click',onTap,true);el.addEventListener('wheel',onWheel,{capture:true,passive:false});el.addEventListener('touchstart',onTouch,{passive:true});
  stage.addEventListener('pointerleave',onLeave);document.addEventListener('pointerdown',onOutside,true);addEventListener('pointerup',onRelease);addEventListener('keydown',onKey);
  m.on('load',()=>{m.addImage('route-arrow',arrowIcon(),{sdf:true,pixelRatio:2});setReady(true)});
  m.on('error',()=>setError('The map could not load. Please reload to try again.'));
  m.addControl(new maplibregl.ScaleControl({maxWidth:100,unit:'metric'}),'bottom-left');
  m.on('mouseenter','world-fill',()=>{m.getCanvas().style.cursor='pointer'});
  m.on('mouseleave','world-fill',()=>{m.getCanvas().style.cursor=''});
  const compared=(p:maplibregl.Point)=>!!side.current.map&&p.x>=side.current.split*m.getContainer().clientWidth;
  for(const id of routeLineIds){
   m.on('mouseenter',id,()=>{m.getCanvas().style.cursor='pointer'});
   m.on('mouseleave',id,()=>{m.getCanvas().style.cursor=''});
   m.on('click',id,e=>{
    if(compared(e.point))return;
    const p=e.features?.[0]?.properties as {title:string;start:number;now:boolean}|undefined;if(!p)return;
    inspect.current();
    new maplibregl.Popup({closeButton:true,maxWidth:'240px',className:'polity-popup'}).setLngLat(e.lngLat).setHTML(`<strong>${escape(p.title)}</strong><span>${p.now?'On the move in':'Route taken in'} ${formatYear(p.start)}</span><small>Straight lines between recorded stops, not the exact path</small>`).addTo(m);
   });
  }
  m.on('click',e=>{
   if(!m.getLayer('world-fill'))return;
   // Right of the divider the reader sees the comparison map, so the popup describes its borders.
   const other=side.current.map;
   if(other&&compared(e.point)){
    const p=other.queryRenderedFeatures(e.point,{layers:['world-fill']})[0]?.properties as Partial<PolityProps>&{n:string;f:number;t:number}|undefined;if(!p)return;
    inspect.current();
    new maplibregl.Popup({closeButton:true,maxWidth:'240px',className:'polity-popup'}).setLngLat(e.lngLat).setHTML(polityPopup(p)).addTo(other);
    return;
   }
   if(m.getLayoutProperty('world-fill','visibility')==='none')return;
   if(m.getLayoutProperty('route-line','visibility')!=='none'&&m.queryRenderedFeatures(e.point,{layers:routeLineIds}).length)return;
   const p=m.queryRenderedFeatures(e.point,{layers:['world-fill']})[0]?.properties as Partial<PolityProps>&{n:string;f:number;t:number}|undefined;if(!p)return;
   inspect.current();
   new maplibregl.Popup({closeButton:true,maxWidth:'240px',className:'polity-popup'}).setLngLat(e.lngLat).setHTML(polityPopup(p)).addTo(m);
  });
  const placeLabels=()=>fitPolityLabels(polityLabels.current,m.getZoom());
  m.on('zoomend',placeLabels);
  labelUpdate.current=placeLabels;
  addPlaceNames(m,['continent','sea']);
  markers.current=events.map(e=>{const el=document.createElement('button');el.className='event-pin event-diamond';el.title=`${e.title} · ${formatYear(e.year)}`;el.setAttribute('aria-label',el.title);el.style.display='none';el.onclick=event=>{event.stopPropagation();selection.current(e.id)};return new maplibregl.Marker({element:el}).setLngLat(e.position).addTo(m)});
  placeMarkers.current=places.map((f,index)=>{const el=document.createElement('button');el.className='place-pin';el.style.display='none';el.style.setProperty('--pin-color',colors[f.spanIds[0]]);const name=document.createElement('span');name.textContent=f.title;if(index>0&&f.geometry.type==='Point'){const previous=places[index-1].geometry;if(previous.type==='Point'&&Math.abs(previous.coordinates[0]-f.geometry.coordinates[0])<3&&Math.abs(previous.coordinates[1]-f.geometry.coordinates[1])<3)name.style.top='13px'}el.appendChild(name);el.title=`${f.title} · reference location, not territorial extent`;el.setAttribute('aria-label',el.title);el.onclick=()=>spanSelection.current(f.spanIds[0]);return new maplibregl.Marker({element:el}).setLngLat(f.geometry.type==='Point'?f.geometry.coordinates:[0,0]).addTo(m)});
  return ()=>{clearTimeout(hintTimer);el.removeEventListener('pointerdown',onDown,true);el.removeEventListener('click',onTap,true);el.removeEventListener('wheel',onWheel,true);el.removeEventListener('touchstart',onTouch);stage.removeEventListener('pointerleave',onLeave);document.removeEventListener('pointerdown',onOutside,true);removeEventListener('pointerup',onRelease);removeEventListener('keydown',onKey);el.classList.remove('is-engaged');m.remove();placeMarkers.current=[];regionKey.current='';routeKey.current='';polityLabels.current=[];personMarker.current=null;map.current=null;markers.current=[]};
 },[data]);
 useEffect(()=>{
  if(!ready||!map.current)return;const m=map.current;
  (m.getSource('world') as maplibregl.GeoJSONSource).setData(world);
  ['world-fill','world-line','world-fill-hi','world-line-hi'].forEach(id=>m.setLayoutProperty(id,'visibility',showWorld?'visible':'none'));
  m.getContainer().querySelectorAll<HTMLElement>('.map-label.continent').forEach(el=>{el.style.visibility=showWorld?'hidden':'visible'});
  polityLabels.current.forEach(l=>l.remove());
  polityLabels.current=showWorld?addPolityLabels(m,world):[];
  labelUpdate.current();
  const filter:maplibregl.FilterSpecification=['in',['get','n'],['literal',highlight]];
  m.setFilter('world-fill-hi',filter);m.setFilter('world-line-hi',filter);
 },[world,ready,showWorld,highlight.join('|')]);
 useEffect(()=>{if(!ready||!map.current)return;const m=map.current;if(!m.getSource('regions'))return;const all=combinedFeaturesAt(data,year);all.features.forEach(f=>{f.properties={...f.properties,color:colors[String(f.properties?.spanId)]}});const activeIds=new Set(activeSpans(data,year).map(p=>p.id));
 const features={...all,features:all.features.filter(f=>f.geometry.type!=='LineString')};
 // A route leg is "now" in its own year; earlier legs of the same route stay as a fainter trail, and the latest
 // leg of each route carries its arrowhead.
 const routes=all.features.flatMap(f=>f.geometry.type==='LineString'?[{...f,geometry:f.geometry,properties:{...f.properties,now:f.properties?.start===year} as Record<string,unknown>}]:[]);
 const routeState=routes.map(f=>`${f.id}:${f.properties.now}:${f.properties.color}`).join();
 if(routeState!==routeKey.current){
  routeKey.current=routeState;
  (m.getSource('routes') as maplibregl.GeoJSONSource).setData({type:'FeatureCollection',features:routes});
  const fronts=new Map<unknown,(typeof routes)[number]>();
  routes.forEach(f=>{const r=fronts.get(f.properties.routeId);if(!r||Number(f.properties.start)>Number(r.properties.start))fronts.set(f.properties.routeId,f)});
  (m.getSource('routeHeads') as maplibregl.GeoJSONSource).setData({type:'FeatureCollection',features:[...fronts.values()].map(f=>({type:'Feature',properties:{bearing:arrivalBearing(f.geometry.coordinates)},geometry:{type:'Point',coordinates:f.geometry.coordinates.at(-1)!}}))});
 }
 routeLayers.forEach(l=>m.setLayoutProperty(l.id,'visibility',showRegions?'visible':'none'));
 // Most years keep the same shapes; re-uploading them every year makes playback stutter.
 const key=features.features.map(f=>`${f.id}:${f.properties?.spanId}`).join();
 if(key!==regionKey.current){regionKey.current=key;(m.getSource('regions') as maplibregl.GeoJSONSource).setData(features)}
 ['regions','region-lines','sphere-lines'].forEach(id=>m.setLayoutProperty(id,'visibility',showRegions?'visible':'none'));
 const trailIds=new Set(trail??[]);
 markers.current.forEach((marker,i)=>{
  const e=events[i],el=marker.getElement(),onYear=e.year===year&&e.spanIds.some(id=>activeIds.has(id)),inTrail=trailIds.has(e.id);
  el.style.display=showEvents&&(trailIds.size?inTrail:onYear)?'block':'none';
  el.classList.toggle('past',inTrail&&e.year<year);
  el.classList.toggle('now',e.year===year);
  el.classList.toggle('future',inTrail&&e.year>year);
 });
 const visibleIds=new Set(features.features.map(f=>f.id));placeMarkers.current.forEach((marker,i)=>{marker.getElement().style.display=showRegions&&!trailIds.size&&visibleIds.has(places[i].id)?'block':'none'});
 },[data,year,ready,showRegions,showEvents,trail?.join('|')]);
 useEffect(()=>{
  if(!ready||!map.current)return;const m=map.current;
  personMarker.current?.remove();personMarker.current=null;
  if(!person?.position)return;
  const el=document.createElement('div');el.className='person-pin';el.setAttribute('aria-label',`${person.name}, born in ${person.place}`);
  const name=document.createElement('span');name.textContent=`${person.name} · ${person.place}`;el.appendChild(name);
  personMarker.current=new maplibregl.Marker({element:el}).setLngLat(person.position).addTo(m);
  m.flyTo({center:person.position,zoom:Math.max(m.getZoom(),4.5),padding:cardPadding(),duration:1600,essential:true});
 },[person,ready]);
 // Fit a searched polity once its shapes are in the loaded year, then leave the camera to the reader.
 const flown=useRef<string|undefined>(undefined);
 useEffect(()=>{
  if(!flyTo||!ready||!map.current||flown.current===flyTo)return;
  const points=world.features.filter(f=>highlight.includes(f.properties.n)).flatMap(f=>f.geometry.coordinates.flat(2));if(!points.length)return;
  flown.current=flyTo;
  const box=points.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[180,90,-180,-90]);
  map.current.fitBounds([[box[0],box[1]],[box[2],box[3]]],{padding:cardPadding(),maxZoom:5,duration:1600});
 },[flyTo,world,ready,highlight.join('|')]);
 const fit=()=>{
  if(view){map.current?.flyTo({center:view.center,zoom:view.zoom,padding:cardPadding(),duration:800,essential:true});return}
  const points=data.features.filter(f=>f.spanIds.includes(cameraSpan)).flatMap(f=>f.geometry.type==='Polygon'?f.geometry.coordinates.flat():f.geometry.type==='MultiPolygon'?f.geometry.coordinates.flat(2):[]);if(points.length){const box=points.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[180,90,-180,-90]);map.current?.fitBounds([[box[0],box[1]],[box[2],box[3]]],{padding:cardPadding(),maxZoom:5})}
 };
 useEffect(()=>{if(ready&&!view)fit()},[cameraSpan,ready,view?.key]);
 const flownStory=useRef<string|undefined>(undefined);
 useEffect(()=>{
  if(!view||!ready||!map.current||flownStory.current===view.key)return;
  flownStory.current=view.key;
  map.current.flyTo({center:view.center,zoom:view.zoom,padding:cardPadding(),duration:1600,essential:true});
 },[view?.key,ready]);
 return <><div ref={host} className="map-canvas" aria-label="Interactive historical world map"/>{ready&&showWorld&&map.current&&<CompareSlider leader={map.current} side={side} shown={year} {...compare}/>}{hint&&<div className="map-hint" aria-hidden="true">{hint}</div>}{error&&<div role="alert" className="map-error">{error}</div>}<div className="map-controls"><button title="Zoom in on map" aria-label="Zoom in on map" onClick={()=>map.current?.zoomIn()}><Plus size={18}/></button><button title="Zoom out on map" aria-label="Zoom out on map" onClick={()=>map.current?.zoomOut()}><Minus size={18}/></button><span/><button title="Fit selected territories" aria-label="Fit selected territories" onClick={fit}><LocateFixed size={18}/></button><button title="View whole world" aria-label="View whole world" onClick={()=>map.current?.flyTo({center:[20,20],zoom:0.8})}><Globe2 size={18}/></button></div></>;
}
