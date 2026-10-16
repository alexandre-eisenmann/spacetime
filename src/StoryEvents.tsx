import {useEffect,useRef} from 'react';
import {formatDate,formatYear} from './domain/schema';
import type {eventsFor} from './domain/selectors';
import {playable,type Story} from './data/stories';

type Event=ReturnType<typeof eventsFor>[number];
// The map panel and event strip receive the same resolved story and current event.
export function StoryEvents({title,story,year,playing,events,current,note,onStory,onEvent}:{title:string;story?:Story;year:number;playing:boolean;events:Event[];current?:Event;note:string;onStory:(story:Story)=>void;onEvent:(id:string)=>void}){
 const list=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const track=list.current,card=track?.querySelector<HTMLElement>('[aria-current="step"]');
  if(!track||!card)return;
  const viewport=track.getBoundingClientRect(),item=card.getBoundingClientRect();
  if(item.left>=viewport.left&&item.right<=viewport.right)return;
  // Move only this strip, never the page or keyboard focus.
  track.scrollTo({left:track.scrollLeft+item.left-viewport.left-(track.clientWidth-item.width)/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 },[current?.id,title]);
 return <section className="events-section" aria-label={`Events · ${title}`}>
  <div className="events-title"><div><h2>{title} · Key events</h2><p className="events-position">On the map · {formatYear(year)} · {playing?'Playing':'Paused'} · {current?`Event ${events.findIndex(e=>e.id===current.id)+1} of ${events.length}`:`${events.length} events`}</p></div><label className="event-picker">Story <select aria-label="Choose a story" value={story?.id??''} onChange={e=>{const next=playable.find(s=>s.id===e.target.value);if(next)onStory(next)}}>{!story&&<option value="" disabled>{title}</option>}{playable.map(s=><option value={s.id} key={s.id}>{s.title}</option>)}</select></label></div>
  {events.length?<div className="event-list" ref={list}>{events.map(event=>{
   const selected=current?.id===event.id,state=selected?(event.year===year?'Event in this year':'Latest recorded event'):event.year>year?'Upcoming':event.year===year?'This year':'Past';
   return <button key={event.id} aria-current={selected?'step':undefined} className={`event-card ${selected?'active':''}`} onClick={()=>onEvent(event.id)}><span className="event-state">{state}</span><small>{formatDate(event.date)}</small><h3>{event.title}</h3><p>{event.place}</p></button>;
  })}</div>:<p className="coverage-note">No events are recorded for {title} yet.</p>}
  <p className="coverage-note">{current?<><strong>{current.title} · {formatDate(current.date)}</strong><br/>{current.description}</>:note}</p>
 </section>;
}
