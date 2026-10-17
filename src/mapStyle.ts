import maplibregl from 'maplibre-gl';
import type {FeatureCollection,LineString} from 'geojson';
import {formatYear} from './domain/schema';
import type {PolityProps,WorldTile} from './useWorldTiles';

const wikipedia=(phrase:string)=>`https://en.wikipedia.org/wiki/${encodeURIComponent(phrase.replaceAll(' ','_'))}`;
export const escape=(s:string)=>s.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
export function graticule(){
 const grid:FeatureCollection<LineString>={type:'FeatureCollection',features:[]};
 for(let x=-180;x<=180;x+=15)grid.features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[[x,-80],[x,80]]}});
 for(let y=-75;y<=75;y+=15)grid.features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:Array.from({length:37},(_,i)=>[-180+i*10,y])}});
 return grid;
}
// Needs the land, world and grid sources. The -hi layers outline highlighted polities. The comparison map keeps the
// sea and land but draws polities a little stronger, so its side reads as a different moment.
export const worldLayers=(highlight:boolean,compare=false):maplibregl.LayerSpecification[]=>[
 {id:'water',type:'background',paint:{'background-color':'#c6dcea'}},
 {id:'land',type:'fill',source:'land',paint:{'fill-color':'#f3f0e7'}},
 {id:'world-fill',type:'fill',source:'world',paint:{'fill-color':['get','c'],'fill-opacity':compare?0.72:0.5}},
 ...(highlight?[{id:'world-fill-hi',type:'fill',source:'world',filter:['==',['get','n'],''],paint:{'fill-color':['get','c'],'fill-opacity':0.78}} as maplibregl.LayerSpecification]:[]),
 {id:'coast',type:'line',source:'land',paint:{'line-color':'#9fb6c6','line-width':1}},
 {id:'world-line',type:'line',source:'world',paint:{'line-color':'#48506a','line-opacity':compare?0.6:0.45,'line-width':['interpolate',['linear'],['zoom'],1,0.3,6,1]}},
 ...(highlight?[{id:'world-line-hi',type:'line',source:'world',filter:['==',['get','n'],''],paint:{'line-color':'#1d2740','line-width':2.8}} as maplibregl.LayerSpecification]:[]),
 {id:'grid',type:'line',source:'grid',paint:{'line-color':'#5f87a3','line-opacity':0.12,'line-width':0.7}}
];
const placeNames:[string,number,number,'continent'|'sea'][]=[['EUROPE',15,51,'continent'],['AFRICA',17,20,'continent'],['ASIA',72,48,'continent'],['Mediterranean Sea',18,34,'sea'],['Arabian Sea',63,19,'sea'],['Black Sea',34,43,'sea']];
export function addPlaceNames(m:maplibregl.Map,kinds:string[]){
 placeNames.filter(([,,,kind])=>kinds.includes(kind)).forEach(([text,x,y,kind])=>{const el=document.createElement('span');el.className=`map-label ${kind}`;el.textContent=text;el.setAttribute('aria-hidden','true');new maplibregl.Marker({element:el}).setLngLat([x,y]).addTo(m)});
}
// Labels appear by polity size: about 300,000 km² at the default zoom, four times smaller per zoom level.
const labelThreshold=(zoom:number)=>3e5*4**(2.8-zoom);
export const addPolityLabels=(m:maplibregl.Map,world:WorldTile)=>[...world.features].sort((a,b)=>b.properties.a-a.properties.a).map(f=>{const el=document.createElement('span');el.className='map-label polity';el.textContent=f.properties.s??f.properties.n;el.dataset.area=String(f.properties.a);el.setAttribute('aria-hidden','true');return new maplibregl.Marker({element:el}).setLngLat([f.properties.lx,f.properties.ly]).addTo(m)});
export function fitPolityLabels(labels:maplibregl.Marker[],zoom:number){
 const min=labelThreshold(zoom);let shown=0;
 labels.forEach(marker=>{const area=Number(marker.getElement().dataset.area);const show=area>=min&&shown<70;if(show)shown++;marker.getElement().style.display=show?'block':'none'});
}
export const polityPopup=(p:Partial<PolityProps>&{n:string;f:number;t:number})=>`<strong>${escape(p.s??p.n)}</strong>${p.s?`<small>${escape(p.n)}</small>`:''}<span>This border: ${formatYear(p.f)} – ${formatYear(p.t)}</span><small>Border from Cliopatria</small>${p.e?`<small>${escape(p.e)}</small>`:''}${p.w?`<a href="${wikipedia(p.w)}" target="_blank" rel="noreferrer">Wikipedia ↗</a>`:''}`;
