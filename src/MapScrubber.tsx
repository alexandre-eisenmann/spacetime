import {useEffect,useRef,useState,type KeyboardEvent,type PointerEvent,type ReactNode} from 'react';
import {Minus,Plus} from 'lucide-react';
import {formatYear} from './domain/schema';
import {centeredWindow,windowCenter} from './domain/timeline';

const steps=[1,2,5,10,20,25,50,100,200,250,500,1000,2000];
const LABEL_GAP=96;
const capture=(e:PointerEvent<HTMLElement>)=>{try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}};
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

// Time control under the map. The ruler shares the timeline's window, so both always show the same year and zoom.
export function MapScrubber({year,note,window,bounds,onWindow,onDate,children}:{year:number;note:string;window:[number,number];bounds:[number,number];onWindow:(window:[number,number])=>void;onDate:(year:number)=>void;children?:ReactNode}){
 const [start,end]=window,width=end-start;
 const tape=useRef<HTMLDivElement>(null),[tapePx,setTapePx]=useState(600);
 const view=useRef(window),move=useRef(onWindow);view.current=window;move.current=onWindow;
 const carry=useRef(0),fling=useRef(0);
 useEffect(()=>{const el=tape.current;if(!el)return;const ro=new ResizeObserver(([e])=>{if(e.contentRect.width)setTapePx(e.contentRect.width)});ro.observe(el);return ()=>ro.disconnect()},[]);
 useEffect(()=>()=>cancelAnimationFrame(fling.current),[]);
 const pan=(years:number)=>{
  carry.current+=years;const shift=Math.trunc(carry.current);if(!shift)return false;carry.current-=shift;
  const [a,b]=view.current,next=centeredWindow(windowCenter([a,b])+shift,b-a,bounds);
  const moved=next[0]!==a;view.current=next;move.current(next);return moved;
 };

 // Dragging the ruler moves time under the fixed needle; a quick flick keeps gliding and slows down.
 const drag=useRef<{x:number;t:number;v:number;moved:boolean;id:number}|null>(null);
 const onTapeDown=(e:PointerEvent<HTMLDivElement>)=>{
  if(e.button!==0)return;cancelAnimationFrame(fling.current);carry.current=0;
  drag.current={x:e.clientX,t:e.timeStamp,v:0,moved:false,id:e.pointerId};
 };
 const onTapeMove=(e:PointerEvent<HTMLDivElement>)=>{
  const d=drag.current;if(!d||d.id!==e.pointerId)return;
  const dx=d.x-e.clientX;if(!d.moved&&Math.abs(dx)<4)return;
  if(!d.moved){d.moved=true;capture(e)}
  const years=dx*(view.current[1]-view.current[0])/tapePx,dt=Math.max(1,e.timeStamp-d.t);
  d.v=d.v*.6+years/dt*.4;d.x=e.clientX;d.t=e.timeStamp;pan(years);
 };
 const onTapeUp=(e:PointerEvent<HTMLDivElement>)=>{
  const d=drag.current;drag.current=null;if(!d||d.id!==e.pointerId)return;
  if(!d.moved){const r=e.currentTarget.getBoundingClientRect();onDate(Math.round(start+(e.clientX-r.left)/r.width*width));return}
  let v=d.v,prev=performance.now();
  if(reduceMotion()||Math.abs(v)*tapePx/width<.25||e.timeStamp-d.t>80)return;
  const glide=(t:number)=>{const dt=Math.min(32,t-prev);prev=t;v*=Math.pow(.994,dt);if(!pan(v*dt)||Math.abs(v)*tapePx/width<.02)return;fling.current=requestAnimationFrame(glide)};
  fling.current=requestAnimationFrame(glide);
 };

 // Two-finger horizontal swipes move time; pinch zooms like the timeline. Vertical scrolling stays with the page.
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const onWheel=(e:WheelEvent)=>{
   const [a,b]=view.current,span=b-a;
   if(e.ctrlKey){e.preventDefault();const next=centeredWindow(windowCenter([a,b]),span*Math.exp(e.deltaY*.01),bounds);view.current=next;move.current(next);return}
   const dx=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.shiftKey?e.deltaY:0;if(!dx)return;
   e.preventDefault();cancelAnimationFrame(fling.current);pan(dx*span/(tape.current?.clientWidth||600));
  };
  el.addEventListener('wheel',onWheel,{passive:false});return ()=>el.removeEventListener('wheel',onWheel);
 },[bounds[0],bounds[1]]);

 const keys=(e:KeyboardEvent)=>{
  const page=Math.max(1,Math.round(width/10));
  const to={ArrowLeft:year-(e.shiftKey?10:1),ArrowRight:year+(e.shiftKey?10:1),PageUp:year-page,PageDown:year+page,Home:bounds[0],End:bounds[1]}[e.key];
  if(to!==undefined){e.preventDefault();onDate(Math.max(bounds[0],Math.min(bounds[1],to)))}
 };

 const step=steps.find(s=>s/width*tapePx>=LABEL_GAP)??steps.at(-1)!;
 const minor=step>=10?step/5:step>=2?step/2:0;
 const calendar=(y:number)=>y<=0?1-y:y;
 const ticks:{y:number;major:boolean}[]=[];
 for(let y=Math.max(start-1,bounds[0]);y<=Math.min(end+1,bounds[1]);y++){
  const c=calendar(y);
  if(c%step===0)ticks.push({y,major:true});else if(minor&&c%minor===0)ticks.push({y,major:false});
 }
 const x=(y:number)=>(y-start)/width*100;
 const voidLeft=start<bounds[0]?x(bounds[0]):0,voidRight=end>bounds[1]?100-x(bounds[1]):0;

 return <div ref={root} className="map-scrubber">
  <div className="scrub-year"><strong aria-hidden="true">{formatYear(year)}</strong><span aria-hidden="true">{note}</span>{children}</div>
  <div className="scrub-tape" ref={tape} role="slider" tabIndex={0} aria-label="Year on the map" aria-valuemin={bounds[0]} aria-valuemax={bounds[1]} aria-valuenow={year} aria-valuetext={formatYear(year)} onKeyDown={keys} onPointerDown={onTapeDown} onPointerMove={onTapeMove} onPointerUp={onTapeUp} onPointerCancel={()=>{drag.current=null}}>
   {voidLeft>0&&<div className="scrub-void" style={{left:0,width:`${voidLeft}%`}}/>}
   {voidRight>0&&<div className="scrub-void" style={{right:0,width:`${voidRight}%`}}/>}
   {ticks.map(t=><span key={t.y} className={t.major?'major':''} style={{left:`${x(t.y)}%`}}>{t.major&&<em>{formatYear(t.y)}</em>}</span>)}
   <div className="scrub-needle" aria-hidden="true"/>
  </div>
 </div>;
}

// Above the map: playback controls and a line spanning the whole atlas for long jumps, keeping the current zoom.
export function TimeOverview({year,window,bounds,onWindow,onZoom,children}:{year:number;window:[number,number];bounds:[number,number];onWindow:(window:[number,number])=>void;onZoom:(direction:number)=>void;children?:ReactNode}){
 const [start,end]=window,width=end-start,full=bounds[1]-bounds[0],ox=(y:number)=>(y-bounds[0])/full*100;
 const overview=useRef<HTMLDivElement>(null),overviewDrag=useRef(false);
 const at=(clientX:number)=>{const r=overview.current!.getBoundingClientRect();return Math.round(bounds[0]+Math.max(0,Math.min(1,(clientX-r.left)/r.width))*(bounds[1]-bounds[0]))};
 const onOverviewDown=(e:PointerEvent<HTMLDivElement>)=>{if(e.button!==0)return;capture(e);overviewDrag.current=true;onWindow(centeredWindow(at(e.clientX),width,bounds))};
 const onOverviewMove=(e:PointerEvent<HTMLDivElement>)=>{if(overviewDrag.current)onWindow(centeredWindow(at(e.clientX),width,bounds))};
 return <div className="time-bar">
  {children}
  <div className="scrub-overview" onPointerDown={onOverviewDown} onPointerMove={onOverviewMove} onPointerUp={()=>{overviewDrag.current=false}} onPointerCancel={()=>{overviewDrag.current=false}} title="Slide to travel across all of history">
   <span className="scrub-end">{formatYear(bounds[0])}</span>
   <div className="scrub-line" ref={overview}><i className="scrub-window" style={{left:`${ox(Math.max(bounds[0],start))}%`,width:`${Math.max(.6,ox(Math.min(bounds[1],end))-ox(Math.max(bounds[0],start)))}%`}}/><b className="scrub-dot" style={{left:`${ox(year)}%`}}/></div>
   <span className="scrub-end">Today</span>
   <span className="scrub-zoom" onPointerDown={e=>e.stopPropagation()}><button type="button" aria-label="Zoom out timeline" title={`Show more years (now ${width.toLocaleString('en')})`} disabled={width>=full} onClick={()=>onZoom(1)}><Minus size={14}/></button><button type="button" aria-label="Zoom in timeline" title={`Show fewer years (now ${width.toLocaleString('en')})`} disabled={width<=10} onClick={()=>onZoom(-1)}><Plus size={14}/></button></span>
  </div>
 </div>;
}
