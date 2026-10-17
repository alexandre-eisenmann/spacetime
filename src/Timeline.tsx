import {UserRound,BookOpen,Flag} from 'lucide-react';
import {markColors,isMoment,type Mark} from './data/marks';
import type {SpanFilter} from './FilterMenu';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {formatYear,formatDate,type HistoricalDataset} from './domain/schema';
import {spansInWindow} from './domain/selectors';
import {spanStart,spanEnd,centeredWindow,windowCenter,hasFacet,packLanes,type Layout,type Facet} from './domain/timeline';
export const typeLabel=(kind:string)=>kind==='person-lifetime'?'Lifetime':kind==='campaign'?'Campaign':kind==='era'?'Story':'Period';
type Span=HistoricalDataset['spans'][number];
export function Timeline({data,layout,facets,marks,filter,showMarks,off,loading,loadError,colors,bounds,year,window,selected,storySpans,focused,onDate,onWindow,onSpan,onEvent}:{data:HistoricalDataset;layout:Layout;facets:Facet[];marks:Mark[];filter:SpanFilter;showMarks:boolean;off:string[];loading:boolean;loadError:string;colors:Record<string,string>;bounds:[number,number];year:number;window:[number,number];selected:string;storySpans?:string[];focused:boolean;onDate:(year:number)=>void;onWindow:(window:[number,number])=>void;onSpan:(id:string)=>void;onEvent:(id:string)=>void}){
 const [expanded,setExpanded]=useState(false);const [start,end]=window,width=end-start;
 // Keep one year of overscan for the fractional playback offset.
 // Curated spans are stories; spans from the people tiles carry a layout.
 const inView=spansInWindow(data,start-1,end+1).filter(p=>filter==='all'||(filter==='people')===!!layout[p.id]);
 const rows=inView.filter(p=>!layout[p.id]);
 // Curated story chapters share packed lanes like everything else; packing all of them keeps lanes stable while panning.
 const storyLane=useMemo(()=>packLanes(data.spans.filter(s=>!layout[s.id]),3),[data,layout]);
 const storyNums=Array.from({length:Math.max(-1,...Object.values(storyLane))+1},(_,i)=>i);
 const storyLanes=storyNums.map(n=>rows.filter(s=>storyLane[s.id]===n));
 const showPeople=filter!=='stories';
 const enabled=useMemo(()=>new Set(facets.filter(f=>!off.includes(f.id)).map(f=>f.id)),[facets,off]);
 // All facets on uses the import-time lanes. Turning facets off packs whoever still matches.
 const laneOf=useMemo(()=>{
  const people=data.spans.filter(s=>layout[s.id]?.facets.length);
  if(!off.length)return Object.fromEntries(people.map(s=>[s.id,layout[s.id].lane]));
  return packLanes(people.filter(s=>hasFacet(layout[s.id].facets,enabled)),3,s=>layout[s.id].score??0);
 },[data,layout,off,enabled]);
 const people=inView.filter(s=>layout[s.id]?.facets.length&&hasFacet(layout[s.id].facets,enabled));
 // Level of detail: lanes are ordered by notability, so zooming out keeps the top lanes.
 const cap=(width>1200?3:width>600?4:width>250?5:width>100?6:8)*2;
 const numbers=Array.from({length:Math.max(-1,...Object.values(laneOf))+1},(_,i)=>i);
 // The selected person's lane stays visible, so someone found by search is always on screen.
 const selectedLane=people.some(s=>s.id===selected)?laneOf[selected]:undefined;
 const shownNums=expanded?numbers:selectedLane!==undefined&&!numbers.slice(0,cap).includes(selectedLane)?[...numbers.slice(0,cap),selectedLane]:numbers.slice(0,cap);
 const peopleLanes=shownNums.map(n=>people.filter(s=>laneOf[s.id]===n));
 const visiblePeople=peopleLanes.reduce((n,l)=>n+l.length,0);
 const hiddenPeople=people.length-visiblePeople;
 const x=(y:number)=>(y-start)/width*100;
 const [activeMark,setActiveMark]=useState(''),[trackPx,setTrackPx]=useState(800);
 const marksInView=showMarks?marks.filter(m=>m.end.latest>=start-1&&m.start.earliest<=end+1):[];
 // Pack full label extents independently of the viewport so playback never changes their lanes.
 const markLanes=useMemo(()=>{
  const lanes:Record<string,number>={};
  const boxes=marks.map(m=>{
   const a=m.start.earliest,b=m.end.latest,text=(m.title.length*6.6+22)/trackPx*width;
   return {m,from:a,to:Math.max(b,a+text)};
  }).sort((p,q)=>p.from-q.from);
  const taken:number[]=[];
  for(const {m,from,to} of boxes){
   const lane=taken.findIndex(t=>t<from);
   if(lane>=0){taken[lane]=to;lanes[m.id]=lane}else if(taken.length<4){lanes[m.id]=taken.length;taken.push(to)}
  }
  return lanes;
 },[marks,width,trackPx]);
 const visibleMarkCount=marksInView.filter(m=>markLanes[m.id]!==undefined).length;
 const markLaneCount=Math.max(1,...Object.values(markLanes).map(l=>l+1));
 const markTitle=(m:Mark)=>`${m.title} · ${isMoment(m)?formatDate(m.start):`${formatDate(m.start)} to ${formatDate(m.end)}`}${m.note?` · ${m.note}`:''}`;
 const marksLayer=marksInView.map(m=>{const a=x(m.start.earliest),b=x(m.end.latest);return <div key={m.id} className={`${isMoment(m)?'mark-line':'mark-band'}${activeMark===m.id?' active':''}`} style={{left:`${a}%`,...(isMoment(m)?{}:{width:`${Math.max(.2,b-a)}%`}),['--mark' as string]:markColors[m.category]}}/>});
 const root=useRef<HTMLElement>(null),view=useRef({start,end}),move=useRef(onWindow),carry=useRef(0);
 view.current={start,end};move.current=onWindow;
 useEffect(()=>{
  const axis=root.current?.querySelector('.stack-axis-track');if(!axis)return;
  const ro=new ResizeObserver(([e])=>{if(e.contentRect.width)setTrackPx(e.contentRect.width)});ro.observe(axis);
  return ()=>ro.disconnect();
 },[]);
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const onWheel=(e:WheelEvent)=>{
   const track=el.querySelector('.stack-axis-track')?.getBoundingClientRect();if(!track?.width)return;
   const {start,end}=view.current,span=end-start;
   if(e.ctrlKey){
    // Trackpad pinch arrives as ctrl+wheel; zoom around the centre line so the map's year holds still.
    e.preventDefault();
    const [s,t]=centeredWindow(windowCenter([start,end]),span*Math.exp(e.deltaY*0.01),bounds);
    view.current={start:s,end:t};move.current([s,t]);
    return;
   }
   const dx=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.shiftKey?e.deltaY:0;
   if(!dx)return;
   e.preventDefault();
   pan(dx*span/track.width);
  };
  // Mouse drag pans like a map; a drag never counts as a click on a bar.
  let drag:{x:number;moved:boolean}|undefined;
  const onDown=(e:PointerEvent)=>{if(e.pointerType==='mouse'&&e.button===0&&(e.target as Element).closest('.stack-rows,.stack-axis-track'))drag={x:e.clientX,moved:false}};
  const onMove=(e:PointerEvent)=>{
   if(!drag)return;const track=el.querySelector('.stack-axis-track')?.getBoundingClientRect();if(!track?.width)return;
   const dx=drag.x-e.clientX;if(!drag.moved&&Math.abs(dx)<4)return;
   drag.moved=true;drag.x=e.clientX;el.classList.add('dragging');
   pan(dx*(view.current.end-view.current.start)/track.width);
  };
  const onUp=()=>{if(drag?.moved)setTimeout(()=>el.classList.remove('dragging'));drag=undefined};
  const onClick=(e:MouseEvent)=>{if(el.classList.contains('dragging')){e.stopPropagation();e.preventDefault()}};
  el.addEventListener('wheel',onWheel,{passive:false});el.addEventListener('pointerdown',onDown);addEventListener('pointermove',onMove);addEventListener('pointerup',onUp);el.addEventListener('click',onClick,true);
  return ()=>{el.removeEventListener('wheel',onWheel);el.removeEventListener('pointerdown',onDown);removeEventListener('pointermove',onMove);removeEventListener('pointerup',onUp);el.removeEventListener('click',onClick,true)};
 },[bounds[0],bounds[1]]);
 const pan=(years:number)=>{
  carry.current+=years;const shift=Math.trunc(carry.current);if(!shift)return;carry.current-=shift;
  const {start,end}=view.current,[s,t]=centeredWindow(windowCenter([start,end])+shift,end-start,bounds);
  view.current={start:s,end:t};move.current([s,t]);
 };
 const outside=<>{start<bounds[0]&&<div className="track-void" style={{left:0,width:`${x(bounds[0])}%`}}/>}{end>bounds[1]&&<div className="track-void" style={{left:`${x(bounds[1])}%`,right:0}}/>}</>;
 const pick=(p:Span)=>{onSpan(p.id);onDate(Math.max(spanStart(p),Math.min(spanEnd(p),year)))};
 const track=(content:ReactNode,p?:Span)=><div className="stack-track" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();onDate(Math.round(start+(e.clientX-r.left)/r.width*width));if(p)onSpan(p.id)}}>{outside}{content}</div>;
 const bar=(p:Span,text:string,extra='')=>{const a=spanStart(p),b=spanEnd(p),left=x(a),right=x(b);return <button key={p.id} className={`span-bar ${extra} ${selected===p.id?'selected':storySpans?.includes(p.id)?'in-story':''}`} onClick={e=>{e.stopPropagation();pick(p)}} aria-label={`Select ${p.title}`} title={`${p.title} · ${formatDate(p.interval.start)} to ${layout[p.id]?.living?'present (living)':formatDate(p.interval.end)}${layout[p.id]?` · ${layout[p.id].subtitle}`:''}`} style={{left:`${left}%`,width:`${Math.max(0,right-left)}%`,['--c' as string]:colors[p.id],['--label-offset' as string]:-left,background:colors[p.id]}}><span>{text}</span></button>};
 return <section ref={root} className={`timeline stacked-timeline${focused&&inView.some(s=>s.id===selected)?' focusing':''}`}>
 <div className="timeline-body"><div className="marks-layer" aria-hidden="true"><i>{marksLayer}</i></div><div className="playhead-layer" aria-hidden="true"><i/></div>
 <div className="stack-axis" aria-hidden="true"><div className="stack-axis-track"/></div>
 {showMarks&&<div className="lane-group"><div className="group-head"><Flag size={14} style={{color:'var(--muted)'}}/><span><strong>Turning points</strong><small>{marksInView.length} on screen</small>{marksInView.length>visibleMarkCount&&<small>Zoom in for {marksInView.length-visibleMarkCount} more</small>}</span></div><div className="stack-row marks-row"><div className="marks-track" style={{height:markLaneCount*20+8}}>{track(marksInView.filter(m=>markLanes[m.id]!==undefined).map(m=>{const a=x(m.start.earliest),b=x(m.end.latest);return <button key={m.id} type="button" className={`mark-label${isMoment(m)?' moment':''}${activeMark===m.id?' active':''}`} title={markTitle(m)} aria-label={markTitle(m)} style={{left:`${a}%`,top:markLanes[m.id]*20+4,width:isMoment(m)?undefined:`${Math.max(.2,b-a)}%`,['--mark' as string]:markColors[m.category]}} onMouseEnter={()=>setActiveMark(m.id)} onMouseLeave={()=>setActiveMark('')} onClick={e=>{e.stopPropagation();onDate(m.start.latest)}}><i/><span>{m.title}</span></button>}))}</div></div></div>}
 <div className="stack-rows">{!!storyLanes.length&&<div className="lane-group"><div className="group-head"><BookOpen size={14} style={{color:'var(--muted)'}}/><span><strong>Stories</strong><small>{rows.length} on screen</small></span></div>{storyLanes.map((spans,i)=><div className="stack-row lane" key={`story-${storyNums[i]}`}>{track(<>{spans.map(p=>bar(p,p.title,'story'))}{width<=250&&data.events.filter(e=>spans.some(p=>e.spanIds[0]===p.id)&&e.date.latest>=start&&e.date.latest<=end).map(e=><button key={e.id} className="timeline-event" aria-label={`${e.title}, ${formatDate(e.date)}`} title={`${e.title} · ${formatDate(e.date)}`} style={{left:`${x(e.date.latest)}%`}} onClick={ev=>{ev.stopPropagation();onEvent(e.id)}}/>)}</>)}</div>)}</div>}
 {showPeople&&!!peopleLanes.length&&<div className="lane-group"><div className="group-head"><UserRound size={14} style={{color:'var(--muted)'}}/><span><strong>People</strong><small>{visiblePeople} shown</small>{(hiddenPeople>0||expanded)&&<button className="lane-more" title="Lanes are ordered by notability; zoom in to reveal more" onClick={()=>setExpanded(v=>!v)}>{expanded?'Show fewer':`+${hiddenPeople} more`}</button>}</span></div>{peopleLanes.map((spans,i)=><div className="stack-row lane" key={shownNums[i]}>{track(spans.map(p=>bar(p,p.title,`person${layout[p.id].living?' living':''}`)))}</div>)}</div>}
 {showPeople&&!people.length&&!!inView.some(s=>layout[s.id]?.facets.length)&&<p className="no-spans">No people with the selected facets in this window.</p>}
 {!inView.length&&<p className="no-spans">{loading?'Loading people for this period…':'Nothing here yet. Try another year or change the filter.'}</p>}</div></div>
 <div className="timeline-footer"><span>{formatYear(Math.max(start,bounds[0]))}</span><span>Drag or swipe to move through time · pinch to zoom · click to jump · the orange line is the year on the map{loadError?` · ${loadError}`:loading?' · loading people…':''}<br/>People: <a href="https://pantheon.world/" target="_blank" rel="noreferrer">Pantheon</a> (<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>) · dates: <a href="https://www.wikidata.org/" target="_blank" rel="noreferrer">Wikidata</a> (CC0)</span><span>{formatYear(Math.min(end,bounds[1]))}</span></div></section>
}
