import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { FeatureCollection, LineString } from 'geojson';
import { Plus, Minus, LocateFixed, Globe2 } from 'lucide-react';
import { combinedFeaturesAt, activeSpans } from './domain/selectors';
import { formatYear, type HistoricalDataset } from './domain/schema';
import { asset } from './asset';
import type {WorldTile} from './useWorldTiles';
import type {PersonEntry} from './domain/timeline';
import 'maplibre-gl/dist/maplibre-gl.css';
const wikipedia=(phrase:string)=>`https://en.wikipedia.org/wiki/${encodeURIComponent(phrase.replaceAll(' ','_'))}`;
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
// Labels appear by polity size: about 300,000 km² at the default zoom, four times smaller per zoom level.
const labelThreshold=(zoom:number)=>3e5*4**(2.8-zoom);
// Space for the story card on the left of wide maps.
const cardPadding=()=>window.innerWidth<600?{top:60,bottom:60,left:30,right:60}:{top:65,bottom:40,left:350,right:70};
export function Atlas({data,world,colors,cameraSpan,year,showRegions,showWorld,showEvents,highlight,flyTo,person,view,trail,onSelect,onSpan,onInspect}:{data:HistoricalDataset;world:WorldTile;colors:Record<string,string>;cameraSpan:string;year:number;showRegions:boolean;showWorld:boolean;showEvents:boolean;highlight:string[];flyTo?:string;person:PersonEntry|null;view?:{key:string;center:[number,number];zoom:number};trail?:string[];onSelect:(id:string)=>void;onSpan:(id:string)=>void;onInspect:()=>void}) {
 const personMarker=useRef<maplibregl.Marker|null>(null);
 const polityLabels=useRef<maplibregl.Marker[]>([]),labelUpdate=useRef(()=>{});
 const events=data.events.map(e=>({...e,year:e.date.latest,position:data.places.find(p=>p.id===e.placeId)!.position}));
 const places=data.features.filter(f=>f.geometry.type==='Point');
 const placeMarkers=useRef<maplibregl.Marker[]>([]),regionKey=useRef('');
 const spanSelection=useRef(onSpan);spanSelection.current=onSpan;
 const host=useRef<HTMLDivElement>(null), map=useRef<maplibregl.Map|null>(null), markers=useRef<maplibregl.Marker[]>([]);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[hint,setHint]=useState('');
 const inspect=useRef(onInspect);inspect.current=onInspect;
 const selection=useRef(onSelect); selection.current=onSelect;
 useEffect(()=>{
  if(!host.current)return;
  setReady(false);
  const grid:FeatureCollection<LineString>={type:'FeatureCollection',features:[]};
  for(let x=-180;x<=180;x+=15)grid.features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[[x,-80],[x,80]]}});
  for(let y=-75;y<=75;y+=15)grid.features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:Array.from({length:37},(_,i)=>[-180+i*10,y])}});
  let m:maplibregl.Map;
  try {m=new maplibregl.Map({container:host.current,center:[31,37],zoom:2.8,minZoom:0.5,maxZoom:7,attributionControl:false,renderWorldCopies:false,scrollZoom:false,dragPan:false,touchZoomRotate:false,touchPitch:false,style:{version:8,sources:{land:{type:'geojson',data:asset('/data/land.geojson')},grid:{type:'geojson',data:grid},world:{type:'geojson',data:{type:'FeatureCollection',features:[]}},regions:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:[{id:'water',type:'background',paint:{'background-color':'#c6dcea'}},{id:'land',type:'fill',source:'land',paint:{'fill-color':'#f3f0e7'}},{id:'world-fill',type:'fill',source:'world',paint:{'fill-color':['get','c'],'fill-opacity':0.5}},{id:'world-fill-hi',type:'fill',source:'world',filter:['==',['get','n'],''],paint:{'fill-color':['get','c'],'fill-opacity':0.78}},{id:'coast',type:'line',source:'land',paint:{'line-color':'#9fb6c6','line-width':1}},{id:'world-line',type:'line',source:'world',paint:{'line-color':'#48506a','line-opacity':0.45,'line-width':['interpolate',['linear'],['zoom'],1,0.3,6,1]}},{id:'world-line-hi',type:'line',source:'world',filter:['==',['get','n'],''],paint:{'line-color':'#1d2740','line-width':2.8}},{id:'grid',type:'line',source:'grid',paint:{'line-color':'#5f87a3','line-opacity':0.12,'line-width':0.7}},{id:'regions',type:'fill',source:'regions',paint:{'fill-color':['coalesce',['get','color'],'#ad774d'],'fill-opacity':['case',['==',['get','relation'],'control'],0.22,0.18]}},{id:'region-lines',type:'line',source:'regions',filter:['==',['get','relation'],'control'],paint:{'line-color':['get','color'],'line-opacity':0.95,'line-width':2.2}},{id:'sphere-lines',type:'line',source:'regions',filter:['!=',['get','relation'],'control'],paint:{'line-color':['get','color'],'line-opacity':0.9,'line-width':1.3,'line-dasharray':[3,2]}}]}});}catch{setError('This atlas needs a browser with WebGL enabled. The timeline is still available.');return;}
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
  m.on('load',()=>setReady(true));
  m.on('error',()=>setError('The map could not load. Please reload to try again.'));
  m.addControl(new maplibregl.ScaleControl({maxWidth:100,unit:'metric'}),'bottom-left');
  m.on('mouseenter','world-fill',()=>{m.getCanvas().style.cursor='pointer'});
  m.on('mouseleave','world-fill',()=>{m.getCanvas().style.cursor=''});
  m.on('click','world-fill',e=>{
   const p=e.features?.[0]?.properties as {n:string;f:number;t:number;w?:string}|undefined;if(!p)return;
   inspect.current();
   const link=p.w?`<a href="${wikipedia(p.w)}" target="_blank" rel="noreferrer">Wikipedia ↗</a>`:'';
   new maplibregl.Popup({closeButton:true,maxWidth:'240px',className:'polity-popup'}).setLngLat(e.lngLat).setHTML(`<strong>${escape(p.n)}</strong><span>This border: ${formatYear(p.f)} – ${formatYear(p.t)}</span><small>Border from Cliopatria</small>${link}`).addTo(m);
  });
  const placeLabels=()=>{const min=labelThreshold(m.getZoom());let shown=0;polityLabels.current.forEach(marker=>{const area=Number(marker.getElement().dataset.area);const show=area>=min&&shown<70;if(show)shown++;marker.getElement().style.display=show?'block':'none'})};
  m.on('zoomend',placeLabels);
  labelUpdate.current=placeLabels;
  const labels:[string,number,number,string][]=[['EUROPE',15,51,'continent'],['AFRICA',17,20,'continent'],['ASIA',72,48,'continent'],['Mediterranean Sea',18,34,'sea'],['Arabian Sea',63,19,'sea'],['Black Sea',34,43,'sea']];
  labels.forEach(([text,x,y,kind])=>{const el=document.createElement('span');el.className=`map-label ${kind}`;el.textContent=text;el.setAttribute('aria-hidden','true');new maplibregl.Marker({element:el}).setLngLat([x,y]).addTo(m);});
  markers.current=events.map(e=>{const el=document.createElement('button');el.className='event-pin event-diamond';el.title=`${e.title} · ${formatYear(e.year)}`;el.setAttribute('aria-label',el.title);el.style.display='none';el.onclick=event=>{event.stopPropagation();selection.current(e.id)};return new maplibregl.Marker({element:el}).setLngLat(e.position).addTo(m)});
  placeMarkers.current=places.map((f,index)=>{const el=document.createElement('button');el.className='place-pin';el.style.display='none';el.style.setProperty('--pin-color',colors[f.spanIds[0]]);const name=document.createElement('span');name.textContent=f.title;if(index>0&&f.geometry.type==='Point'){const previous=places[index-1].geometry;if(previous.type==='Point'&&Math.abs(previous.coordinates[0]-f.geometry.coordinates[0])<3&&Math.abs(previous.coordinates[1]-f.geometry.coordinates[1])<3)name.style.top='13px'}el.appendChild(name);el.title=`${f.title} · reference location, not territorial extent`;el.setAttribute('aria-label',el.title);el.onclick=()=>spanSelection.current(f.spanIds[0]);return new maplibregl.Marker({element:el}).setLngLat(f.geometry.type==='Point'?f.geometry.coordinates:[0,0]).addTo(m)});
  return ()=>{clearTimeout(hintTimer);el.removeEventListener('pointerdown',onDown,true);el.removeEventListener('click',onTap,true);el.removeEventListener('wheel',onWheel,true);el.removeEventListener('touchstart',onTouch);stage.removeEventListener('pointerleave',onLeave);document.removeEventListener('pointerdown',onOutside,true);removeEventListener('pointerup',onRelease);removeEventListener('keydown',onKey);el.classList.remove('is-engaged');m.remove();placeMarkers.current=[];regionKey.current='';polityLabels.current=[];personMarker.current=null;map.current=null;markers.current=[]};
 },[data]);
 useEffect(()=>{
  if(!ready||!map.current)return;const m=map.current;
  (m.getSource('world') as maplibregl.GeoJSONSource).setData(world);
  ['world-fill','world-line','world-fill-hi','world-line-hi'].forEach(id=>m.setLayoutProperty(id,'visibility',showWorld?'visible':'none'));
  m.getContainer().querySelectorAll<HTMLElement>('.map-label.continent').forEach(el=>{el.style.visibility=showWorld?'hidden':'visible'});
  polityLabels.current.forEach(l=>l.remove());
  polityLabels.current=showWorld?[...world.features].sort((a,b)=>b.properties.a-a.properties.a).map(f=>{const el=document.createElement('span');el.className='map-label polity';el.textContent=f.properties.n;el.dataset.area=String(f.properties.a);el.setAttribute('aria-hidden','true');return new maplibregl.Marker({element:el}).setLngLat([f.properties.lx,f.properties.ly]).addTo(m)}):[];
  labelUpdate.current();
  const filter:maplibregl.FilterSpecification=['in',['get','n'],['literal',highlight]];
  m.setFilter('world-fill-hi',filter);m.setFilter('world-line-hi',filter);
 },[world,ready,showWorld,highlight.join('|')]);
 useEffect(()=>{if(!ready||!map.current)return;const m=map.current;if(!m.getSource('regions'))return;const features=combinedFeaturesAt(data,year);features.features.forEach(f=>{f.properties={...f.properties,color:colors[String(f.properties?.spanId)]}});const activeIds=new Set(activeSpans(data,year).map(p=>p.id));
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
 return <><div ref={host} className="map-canvas" aria-label="Interactive historical world map"/>{hint&&<div className="map-hint" aria-hidden="true">{hint}</div>}{error&&<div role="alert" className="map-error">{error}</div>}<div className="map-controls"><button title="Zoom in on map" aria-label="Zoom in on map" onClick={()=>map.current?.zoomIn()}><Plus size={18}/></button><button title="Zoom out on map" aria-label="Zoom out on map" onClick={()=>map.current?.zoomOut()}><Minus size={18}/></button><span/><button title="Fit selected territories" aria-label="Fit selected territories" onClick={fit}><LocateFixed size={18}/></button><button title="View whole world" aria-label="View whole world" onClick={()=>map.current?.flyTo({center:[20,20],zoom:0.8})}><Globe2 size={18}/></button></div></>;
}
