import {useEffect,useRef,useState} from 'react';
import {SlidersHorizontal,X} from 'lucide-react';
import type {Facet} from './domain/timeline';

export type SpanFilter='all'|'stories'|'people';
const shows:[SpanFilter,string][]=[['all','Everything'],['stories','Stories'],['people','People']];

export function FilterMenu({filter,setFilter,showMarks,setShowMarks,facets,off,setOff}:{filter:SpanFilter;setFilter:(f:SpanFilter)=>void;showMarks:boolean;setShowMarks:(on:boolean)=>void;facets:Facet[];off:string[];setOff:(off:string[])=>void}){
 const [open,setOpen]=useState(false),box=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  const close=(e:PointerEvent)=>{if(!box.current?.contains(e.target as Node))setOpen(false)};
  const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};
  addEventListener('pointerdown',close);addEventListener('keydown',esc);
  return ()=>{removeEventListener('pointerdown',close);removeEventListener('keydown',esc)};
 },[open]);
 const changes=Number(filter!=='all')+Number(!showMarks)+Number(off.length>0);
 const toggle=(id:string)=>setOff(off.includes(id)?off.filter(x=>x!==id):[...off,id]);
 return <div className="filter-menu" ref={box}>
  <button type="button" className={`filter-button${changes?' changed':''}`} aria-expanded={open} aria-haspopup="dialog" onClick={()=>setOpen(v=>!v)}><SlidersHorizontal size={14}/> Filter{changes>0&&<b>{changes}</b>}</button>
  {open&&<div className="filter-panel" role="dialog" aria-label="Filter the timeline">
   <div className="filter-head"><strong>Filter the timeline</strong><button type="button" aria-label="Close filters" onClick={()=>setOpen(false)}><X size={16}/></button></div>
   <h4>Show</h4>
   <div className="filter-segments" role="group" aria-label="Show on the timeline">{shows.map(([id,label])=><button key={id} type="button" aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
   <label className="filter-check"><input type="checkbox" checked={showMarks} onChange={e=>setShowMarks(e.target.checked)}/> Turning points <span>wars, pandemics and key moments</span></label>
   {filter!=='stories'&&!!facets.length&&<>
    <h4>People <span><button type="button" disabled={!off.length} onClick={()=>setOff([])}>All</button><button type="button" disabled={off.length===facets.length} onClick={()=>setOff(facets.map(f=>f.id))}>None</button></span></h4>
    <div className="filter-facets" role="group" aria-label="Filter people by facet">{facets.map(f=><button key={f.id} type="button" aria-pressed={!off.includes(f.id)} onClick={()=>toggle(f.id)}><i style={{background:f.color}}/>{f.label}</button>)}</div>
   </>}
  </div>}
 </div>;
}
