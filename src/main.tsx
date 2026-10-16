import React,{useDeferredValue,useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,Info,ChevronDown,ChevronUp,ChevronLeft,ChevronRight,ChevronsLeft,ChevronsRight,Layers,Pause,Play,X} from 'lucide-react';
import '@fontsource-variable/lexend';
import {Atlas} from './Atlas';
import {Timeline,typeLabel} from './Timeline';
import {StoryEvents} from './StoryEvents';
import {catalog,colors as spanColors,bounds} from './data/catalog';
import {chapters,chapterColors} from './data/chapters';
import {polityNamesAt,type PolityEntry} from './data/polities';
import {mergeDatasets,eventsFor,latestEvent,activeSpans,intervalContains} from './domain/selectors';
const stories=mergeDatasets([catalog,chapters]);
import {playable,storyOf,inStory,type Story} from './data/stories';
import {centeredWindow,windowCenter,spanStart,spanEnd,type PersonEntry} from './domain/timeline';
import {SearchBox} from './SearchBox';
import {MapScrubber,TimeOverview} from './MapScrubber';
import {FilterMenu,type SpanFilter} from './FilterMenu';
import {formatYear,formatDate,fromEra} from './domain/schema';
import {useTimelineTiles} from './useTimelineTiles';
import {useWorldTiles} from './useWorldTiles';
import {marks} from './data/marks';
import './style.css';
const PLAY_SECONDS=20;
const zooms=[10,20,50,100,150,250,400,700,1000,1500,3000,bounds[1]-bounds[0]];
const BrandMark=()=><svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.2"/><ellipse cx="16" cy="16" rx="5.5" ry="13" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".45"/><path d="M3 16h26" stroke="currentColor" strokeWidth="1.6" opacity=".45"/><path d="M16 16V8.5M16 16l5.5 3.5" stroke="var(--now)" strokeWidth="2.6" strokeLinecap="round"/><circle cx="16" cy="16" r="2" fill="var(--now)"/></svg>;
// Typed years are calendar years; an empty box shows the current year as its placeholder.
function YearJump({year,onGo}:{year:number;onGo:(year:number)=>void}){
 const [text,setText]=useState(''),[era,setEra]=useState<'BCE'|'CE'>(year<=0?'BCE':'CE');
 useEffect(()=>{if(!text)setEra(year<=0?'BCE':'CE')},[year<=0]);
 const go=()=>{const n=Number.parseInt(text,10);if(!(n>=1))return;onGo(Math.max(bounds[0],Math.min(bounds[1],fromEra(n,era))));setText('')};
 return <form className="year-jump" onSubmit={e=>{e.preventDefault();go()}}><label htmlFor="year-jump">Go to year</label><input id="year-jump" inputMode="numeric" autoComplete="off" placeholder={String(year<=0?1-year:year)} value={text} onChange={e=>setText(e.target.value.replace(/\D/g,'').slice(0,4))}/><select aria-label="Era" value={era} onChange={e=>setEra(e.target.value as 'BCE'|'CE')}><option>BCE</option><option>CE</option></select><button type="submit" disabled={!text}>Go</button></form>;
}
function App(){
 const [playSpeed,setPlaySpeed]=useState(1);
 const [cameraSpan,setCameraSpan]=useState('period-republic');
 const [storyView,setStoryView]=useState<{key:string;center:[number,number];zoom:number}>();
 const [window,setWindow]=useState<[number,number]>(()=>centeredWindow(-200,250,bounds)),[selected,setSelectedSpan]=useState('period-republic'),[eventId,setEventId]=useState<string|null>(null),[playing,setPlaying]=useState(false),[regions,setRegions]=useState(true),[pins,setPins]=useState(true),[layers,setLayers]=useState(false),[sources,setSources]=useState(false);
 const year=windowCenter(window),mapYear=useDeferredValue(year);
 const [worldLayer,setWorldLayer]=useState(true),political=useWorldTiles(mapYear);
 const people=useTimelineTiles(stories,window),data=people.data,colors={...people.colors,...chapterColors,...spanColors};
 // A searched polity is outlined until another span is chosen.
 const [polity,setPolity]=useState<(PolityEntry&{at:number;pick:number})|null>(null);
 const [followYear,setFollowYear]=useState(false);
 const [spanFilter,setSpanFilter]=useState<SpanFilter>('all'),[showMarks,setShowMarks]=useState(true),[facetsOff,setFacetsOff]=useState<string[]>([]);
 const setSelected=(id:string)=>{setSelectedSpan(id);setPolity(null);setFollowYear(false)};
 const span=data.spans.find(p=>p.id===selected)!,story=storyOf(selected);
 const stageSpans=story?.spanIds??(selected==='period-republic'||selected==='period-empire'?['period-republic','period-empire']:[selected]);
 const events=eventsFor(data,story?story.spanIds:[selected]),active=story?inStory(story,year):intervalContains(span.interval,year),current=active?(events.find(e=>e.id===eventId&&e.year===year)??events.filter(e=>e.date.latest<=year).at(-1)):undefined;
 // The map outlines a story's polities only within the story's dates.
 const outlineIds=story?stageSpans.flatMap(id=>data.spans.find(s=>s.id===id)?.entityIds??[]):span.entityIds;
 const highlight=polity?polityNamesAt([polity.id],mapYear):(story?inStory(story,mapYear):intervalContains(span.interval,mapYear))?polityNamesAt(outlineIds,mapYear):[];
 const visible=activeSpans(data,year);const width=window[1]-window[0];
 // Once the user moves away from the selected span, the card describes the most specific story running in the shown year.
 const length=(s:typeof span)=>s.interval.end.latest-s.interval.start.earliest;
 const cardSpan=active||!followYear?span:visible.filter(s=>s.kind!=='person-lifetime').sort((a,b)=>length(a)-length(b))[0]??span;
 const cardEvent=active?current:cardSpan!==span?latestEvent(data,cardSpan.id,year):undefined;
 // On phones the card would cover most of the map, so it starts as a pill and folds again whenever the screen narrows.
 const [cardOpen,setCardOpen]=useState(()=>innerWidth>=600);
 useEffect(()=>{const phone=matchMedia('(max-width:599px)');const fold=()=>{if(phone.matches)setCardOpen(false)};phone.addEventListener('change',fold);return ()=>phone.removeEventListener('change',fold)},[]);
 // Jumps glide the window so the centre line travels to the new year; any swipe or drag takes over.
 const glide=useRef(0);
 const travel=(to:number,w=width)=>{cancelAnimationFrame(glide.current);const from=year,t0=performance.now();const step=(t:number)=>{const k=Math.min(1,(t-t0)/350);setWindow(centeredWindow(Math.round(from+(to-from)*(1-(1-k)**3)),w,bounds));if(k<1)glide.current=requestAnimationFrame(step)};glide.current=requestAnimationFrame(step)};
 // A searched person stays in the spotlight until the reader moves through time themselves.
 const [spotlight,setSpotlight]=useState(false);
 const [person,setPerson]=useState<PersonEntry|null>(null),[personPending,setPersonPending]=useState(false);
 const goDate=(y:number)=>{travel(y);setEventId(null);setPlaying(false);setFollowYear(true);setSpotlight(false)};
 const selectSpan=(id:string)=>{setSelected(id);setEventId(null)};
 const goEvent=(id:string)=>{setCardOpen(true);const e=data.events.find(e=>e.id===id)!;goDate(e.date.latest);setSelected(e.spanIds.includes(selected)?selected:e.spanIds[0]);setEventId(id)};
 const openStory=(s:Story)=>{
  const chapter=s.spanIds.find(id=>{const p=data.spans.find(x=>x.id===id);return p&&intervalContains(p.interval,s.startYear)})??s.spanIds[0];
  setCameraSpan(chapter);setSelected(chapter);setEventId(null);setPlaying(false);setPerson(null);setPersonPending(false);setSpotlight(false);
  setStoryView({key:`${s.id}@${performance.now()}`,center:s.map.center,zoom:s.map.zoom});
  travel(s.startYear,s.windowYears);
 };
 const focus=(id:string)=>{const s=storyOf(id);if(s){openStory(s);return}setCameraSpan(id);setStoryView(undefined);const p=data.spans.find(p=>p.id===id)!;setSelected(id);setEventId(null);setPlaying(false);travel(p.interval.start.latest,Math.min(250,Math.max(20,p.interval.end.latest-p.interval.start.earliest+20)))};
 const zoom=(direction:number)=>{const next=direction>0?(zooms.find(z=>z>width)??zooms.at(-1)!):([...zooms].reverse().find(z=>z<width)??10);setWindow(centeredWindow(year,next,bounds));setSpotlight(false)};
 const moveWindow=(next:[number,number])=>{cancelAnimationFrame(glide.current);setWindow(centeredWindow(windowCenter(next),next[1]-next[0],bounds));setPlaying(false);setFollowYear(true);setSpotlight(false)};
 // A searched person's tile may not be loaded yet, so their bar is selected once it arrives.
 const findPerson=(p:PersonEntry)=>{setPolity(null);setStoryView(undefined);setPerson({...p});setPersonPending(true);setSpotlight(true);setPlaying(false);setEventId(null);travel(p.born,2*(p.died-p.born)+20)};
 useEffect(()=>{if(personPending&&person&&data.spans.some(s=>s.id===person.id)){setSelected(person.id);setPersonPending(false)}},[data,person,personPending]);
 const findPolity=(p:PolityEntry)=>{setPlaying(false);setEventId(null);setPerson(null);setPersonPending(false);setStoryView(undefined);const at=Math.max(bounds[0],Math.min(bounds[1],p.peak));travel(at,Math.min(bounds[1]-bounds[0],Math.max(20,2*(p.to-p.from)+20)));setPolity({...p,at,pick:performance.now()})};
 const personShown=person&&(personPending||selected===person.id)?person:null;
 const territory=data.features.filter(f=>(f.geometry.type==='Polygon'||f.geometry.type==='MultiPolygon')&&f.spanIds.some(id=>stageSpans.includes(id)));
 const playEnd=story?.to??Math.max(...data.spans.filter(p=>stageSpans.includes(p.id)).map(p=>p.interval.end.latest));
 const stages=[...new Set(territory.flatMap(f=>[f.interval.start.latest,f.interval.end.earliest+1]).filter(y=>y>=bounds[0]&&y<=playEnd))].sort((a,b)=>a-b);
 const chapterAt=(y:number)=>stageSpans.find(id=>{const p=data.spans.find(s=>s.id===id);return p&&intervalContains(p.interval,y)});
 const stageDate=(direction:number)=>{const next=direction>0?stages.find(y=>y>year):[...stages].reverse().find(y=>y<year);if(next!==undefined){goDate(next);const c=chapterAt(next);if(c)setSelected(c)}};
 // A playable story crosses its own years in PLAY_SECONDS; other spans still cross one window in that time.
 // The year stays whole; the fraction in between slides the timeline through --play-phase.
 const playStops=story?[story.from,story.to]:stages.length?stages:[Math.max(bounds[0],spanStart(span)),Math.min(bounds[1],spanEnd(span))];
 const live=useRef({width,stages:playStops,stageSpans,paced:!!story,speed:playSpeed,spans:data.spans});live.current={width,stages:playStops,stageSpans,paced:!!story,speed:playSpeed,spans:data.spans};
 const eventIndex=current?events.findIndex(e=>e.id===current.id):-1;
 const previousEvent=events[eventIndex-1],nextEvent=events[eventIndex+1];
 const upcomingEvent=events.find(e=>e.year>year);
 const restartStory=()=>{if(!story)return;goDate(story.from);setSelected(story.spanIds[0])};
 const togglePlay=()=>{setEventId(null);setSpotlight(false);setPlaying(p=>!p)};
 useEffect(()=>{
  if(!playing)return;
  cancelAnimationFrame(glide.current);
  const {stages:all}=live.current,end=all.at(-1)!,style=document.documentElement.style;
  let pos=year>=all[0]&&year<end?year:all[0],shown=NaN,side='',prev=performance.now(),frame=0;
  const tick=(t:number)=>{
   const {width,stageSpans,paced,speed,spans}=live.current;
   const rate=paced?Math.max(1,end-all[0]):width;
   // A hidden tab or long frame resumes where it left off instead of leaping ahead.
   pos=Math.min(end,pos+Math.min(t-prev,100)/1000*rate*speed/PLAY_SECONDS);prev=t;
   const y=Math.floor(pos);
   // The new year must be painted in the same frame as the phase reset, or the timeline kicks back.
   if(y!==shown){shown=y;flushSync(()=>{setWindow(centeredWindow(y,width,bounds));const s=stageSpans.find(id=>{const p=spans.find(x=>x.id===id);return p&&intervalContains(p.interval,y)});if(s&&s!==side){side=s;setSelected(s)}})}
   style.setProperty('--play-phase',String((pos-y)/width));
   if(pos>=end){setPlaying(false);return}
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return ()=>{cancelAnimationFrame(frame);style.removeProperty('--play-phase')};
 },[playing]);
 return <main><header className="topbar"><a className="brand" href="/" aria-label="Space Time home"><BrandMark/>Space Time</a><div className="travel" role="search" aria-label="Choose a place and a year"><SearchBox onPerson={findPerson} onPolity={findPolity} onStory={openStory}/><YearJump year={year} onGo={goDate}/></div><button className="text-button" onClick={()=>setSources(true)}><Info size={17}/> About & sources</button></header>
 <TimeOverview year={year} window={window} bounds={bounds} onWindow={moveWindow} onZoom={zoom}><div className="transport-controls" role="group" aria-label="Move through time">
  <button aria-label="Previous border change" title={stages.length?`Previous border change · ${span.title}`:'No border changes recorded for this story'} disabled={!stages.some(y=>y<year)} onClick={()=>stageDate(-1)}><ChevronsLeft size={16}/></button>
  <button aria-label="One year back" title="One year back" disabled={year<=bounds[0]} onClick={()=>goDate(year-1)}><ChevronLeft size={16}/></button>
  <button className="play" aria-label={playing?'Pause':`Play ${story?.title??span.title}`} title={`${playing?'Pause':'Play'} · ${story?.title??span.title}`} onClick={togglePlay}>{playing?<Pause size={14} fill="currentColor"/>:<Play size={14} fill="currentColor" style={{marginLeft:2}}/>}</button>
  <button aria-label="One year forward" title="One year forward" disabled={year>=bounds[1]} onClick={()=>goDate(year+1)}><ChevronRight size={16}/></button>
  <button aria-label="Next border change" title={stages.length?`Next border change · ${span.title}`:'No border changes recorded for this story'} disabled={!stages.some(y=>y>year)} onClick={()=>stageDate(1)}><ChevronsRight size={16}/></button>
</div></TimeOverview>
 <section className="atlas-shell"><div className="map-stage"><Atlas data={catalog} world={political.world} showWorld={worldLayer} colors={colors} cameraSpan={cameraSpan} year={mapYear} showRegions={regions} showEvents={pins} highlight={highlight} flyTo={polity&&mapYear===polity.at?`${polity.id}@${polity.pick}`:undefined} person={personShown} view={storyView} trail={story&&inStory(story,mapYear)?events.map(e=>e.id):undefined} onSelect={goEvent} onSpan={selectSpan} onInspect={()=>setPlaying(false)}/><div className="map-topline"><button className="layer-button" aria-expanded={layers} onClick={()=>setLayers(!layers)}><Layers size={16}/> Layers</button></div>{layers&&<div className="layer-panel"><strong>Show on the map</strong><label><input type="checkbox" checked={worldLayer} onChange={e=>setWorldLayer(e.target.checked)}/> Borders in this year</label><label><input type="checkbox" checked={regions} onChange={e=>setRegions(e.target.checked)}/> Story territories and places</label><label><input type="checkbox" checked={pins} onChange={e=>setPins(e.target.checked)}/> {story?'Story events on the map':'Events in this year'}</label></div>}
 {!cardOpen?<button className="story-card-mini" aria-expanded={false} aria-label={`Expand panel: ${cardEvent?cardEvent.title:cardSpan.title}`} onClick={()=>setCardOpen(true)}><span className="tiny-line" style={{background:colors[cardSpan.id]}}/><span>{cardEvent?cardEvent.title:cardSpan.title}</span><ChevronUp size={13}/></button>:
 <article className="story-card"><div className="card-time"><strong>On the map · {formatYear(year)}</strong><span>{playing?'Playing':'Paused'}</span></div><div className="card-head"><div className="card-kind"><span className="tiny-line" style={{background:colors[cardSpan.id]}}/>{story?`Story · ${story.title}`:typeLabel(cardSpan.kind)}{cardSpan!==span&&` · in ${formatYear(year)}`}</div><button className="card-toggle" aria-expanded={true} aria-label="Collapse panel" onClick={()=>setCardOpen(false)}><ChevronDown size={15}/></button></div>{story&&<p className="card-story-dates">{formatYear(story.from)} – {formatYear(story.to)}</p>}{cardEvent&&<p className="card-event-context">{cardEvent.date.latest===year?'Event in this year':'Latest recorded event'}</p>}<h2>{cardEvent?cardEvent.title:cardSpan.title}</h2>
 {!active&&<p className="card-away">{story?.title??span.title} ({formatYear(story?.from??span.interval.start.earliest)} – {formatYear(story?.to??span.interval.end.latest)}) is outside {formatYear(year)}{followYear&&cardSpan===span?'; no story runs in this year.':'.'}</p>}<p>{cardEvent?cardEvent.description:cardSpan.provenance.note}</p><div className="card-meta"><span>{cardEvent?cardEvent.place:cardSpan.title}</span><span>{cardEvent?formatDate(cardEvent.date):`${formatYear(cardSpan.interval.start.earliest)} – ${formatYear(cardSpan.interval.end.latest)}`}</span></div>{!active&&<button onClick={()=>story?openStory(story):focus(selected)}>Back to {story?.title??span.title} <ArrowUpRight size={13}/></button>}{cardSpan!==span&&<button onClick={()=>selectSpan(cardSpan.id)}>Select {cardSpan.title} <ArrowUpRight size={13}/></button>}{active&&upcomingEvent&&<p className="card-upcoming">Next: {upcomingEvent.title} · {formatDate(upcomingEvent.date)}</p>}{story&&<nav className="story-event-nav" aria-label="Story events"><button aria-label="Previous story event" disabled={!previousEvent} onClick={()=>previousEvent&&goEvent(previousEvent.id)}>← Previous</button><span>{eventIndex<0?'Story introduction':`Event ${eventIndex+1} of ${events.length}`}</span><button aria-label="Next story event" disabled={!nextEvent} onClick={()=>nextEvent&&goEvent(nextEvent.id)}>Next →</button></nav>}{story&&<div className="card-playback" role="group" aria-label="Story playback"><button onClick={restartStory}>Restart story</button><label>Speed <select aria-label="Playback speed" value={playSpeed} onChange={e=>setPlaySpeed(Number(e.target.value))}><option value={0.25}>0.25×</option><option value={0.5}>0.5×</option><option value={1}>1×</option></select></label></div>}{story&&<details className="card-dot-guide"><summary>Map dot guide</summary><p>Filled: past · orange: this year · outlined: upcoming. Select a dot to pause and read.</p></details>}<button onClick={()=>setSources(true)}>Sources <ArrowUpRight size={14}/></button></article>}
 <div className="map-legend">Click a territory to learn more{highlight.length>0&&<> · <span/> {polity?polity.name:story?.title??span.title}</>}</div><div className="map-credit">Borders: <a href="https://github.com/Seshat-Global-History-Databank/cliopatria" target="_blank" rel="noreferrer">Cliopatria</a> (Seshat), <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · Natural Earth · Modern coastlines</div></div>
 <MapScrubber year={year} note={political.loading?'Loading borders…':political.error||`${political.world.features.length} territories`} window={window} bounds={bounds} onWindow={moveWindow} onDate={goDate}><FilterMenu filter={spanFilter} setFilter={setSpanFilter} showMarks={showMarks} setShowMarks={setShowMarks} facets={people.facets} off={facetsOff} setOff={setFacetsOff}/></MapScrubber>
 <Timeline data={data} layout={people.layout} facets={people.facets} marks={marks} filter={spanFilter} showMarks={showMarks} off={facetsOff} loading={people.pending.length>0} loadError={people.error} onWindow={moveWindow} colors={colors} bounds={bounds} year={year} window={window} selected={selected} storySpans={story?.spanIds} focused={spotlight&&!!person&&selected===person.id} onDate={goDate} onSpan={selectSpan} onEvent={goEvent}/>
 </section>
 <StoryEvents title={cardSpan===span?(story?.title??cardSpan.title):cardSpan.title} story={cardSpan===span?story:storyOf(cardSpan.id)} year={year} playing={playing} events={cardSpan===span?events:eventsFor(data,[cardSpan.id])} current={cardEvent} note={cardSpan.provenance.note} onStory={openStory} onEvent={goEvent}/>

 <footer><span>Space Time <span className="muted">· {data.events.length} events · borders from Cliopatria</span></span><button onClick={()=>setSources(true)}>About & sources <ArrowUpRight size={14}/></button></footer>
 {sources&&<div className="modal-backdrop" onClick={()=>setSources(false)}><section className="notes" role="dialog" aria-modal="true" aria-label="Sources and map notes" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setSources(false);if(e.key==='Tab'){const nodes=e.currentTarget.querySelectorAll<HTMLElement>('button,a[href]');const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}}><button autoFocus className="close" aria-label="Close notes" onClick={()=>setSources(false)}><X/></button><h2>About Space Time</h2><p>Pick a year and the map shows the states and empires recorded for it. Borders come from Cliopatria, the Seshat Global History Databank’s dataset of about 1,500 polities from 3400 BCE to today. Borders are recorded at intervals, so a shape stays the same until its next recorded change; nothing is filled in between. Coverage is richest for Europe and Asia and thinner for the Americas, sub-Saharan Africa and Oceania. Coastlines are modern and only there for orientation.</p><h3>Reading the timeline</h3><p>Square-ended bars are stories: periods of history such as an empire or a war. Rounded bars are lifetimes; a lifetime is not a reign. Dates marked approximate or disputed keep that uncertainty on the cards. Solid outlines on the map show control; dashed outlines show alliance or influence. Athens and Sparta are not in Cliopatria, so their outlines are rough sketches.</p><h3>{span.title}</h3><p>{span.provenance.note}</p><h3>References for this story</h3>{data.sources.filter(s=>new Set([...span.provenance.sourceIds,...events.flatMap(e=>e.provenance.sourceIds)]).has(s.id)).map(s=>s.url?<a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>:<p key={s.id}>{s.title} · Local editorial artifact</p>)}<h3>Map & data</h3><p>Locally bundled Natural Earth land data (public domain), rendered with MapLibre GL JS (BSD-3-Clause). No paid account, API key, or hosted tiles. Modern coastlines are for orientation, not ancient reconstruction.</p><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth — data terms ↗</a><a href="https://github.com/Seshat-Global-History-Databank/cliopatria" target="_blank" rel="noreferrer">Cliopatria v0.2.1 — Seshat Global History Databank, CC BY 4.0 ↗</a></section></div>}
 </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
