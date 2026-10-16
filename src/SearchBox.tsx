import {useEffect,useMemo,useRef,useState} from 'react';
import {Search,MapPin,Landmark,BookOpen} from 'lucide-react';
import {searchByName} from './domain/search';
import {teamPeople} from './data/team';
import {politySearch,type PolityEntry} from './data/polities';
import {storySearch,type Story} from './data/stories';
import {asset} from './asset';
import {formatYear} from './domain/schema';
import type {PersonEntry} from './domain/timeline';

type Hit=(Story&{type:'story';name:string})|(PersonEntry&{type:'person'})|(PolityEntry&{type:'polity'});
const request:{current?:Promise<PersonEntry[]>}={};
const loadIndex=()=>request.current??=fetch(asset('/data/timeline/people-search.json')).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()});
const years=(h:Hit)=>h.type==='person'?`${formatYear(h.born)} – ${h.living?'living':formatYear(h.died)}`:`${formatYear(h.from)} – ${formatYear(h.to)}`;
const polityHits:Hit[]=politySearch.map(p=>({...p,type:'polity'}));
const storyHits:Hit[]=storySearch.map(s=>({...s,type:'story'}));

export function SearchBox({onPerson,onPolity,onStory}:{onPerson:(person:PersonEntry)=>void;onPolity:(polity:PolityEntry)=>void;onStory:(story:Story)=>void}){
 const [people,setPeople]=useState<PersonEntry[]>(),[error,setError]=useState(false);
 const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[active,setActive]=useState(0);
 const box=useRef<HTMLDivElement>(null);
 // Stories lead (they are the classroom entry). Polities follow by largest extent; people by notability.
 const hits=useMemo(()=>{
  const rest=searchByName<Hit>([...polityHits,...[...teamPeople,...people??[]].map(p=>({...p,type:'person' as const}))],query);
  return [...searchByName(storyHits,query),...rest].slice(0,8);
 },[query,people]);
 useEffect(()=>setActive(0),[query]);
 useEffect(()=>{if(open&&!people)loadIndex().then(setPeople,()=>setError(true))},[open]);
 useEffect(()=>{
  const close=(e:PointerEvent)=>{if(!box.current?.contains(e.target as Node))setOpen(false)};
  addEventListener('pointerdown',close);return ()=>removeEventListener('pointerdown',close);
 },[]);
 const pick=(h:Hit)=>{if(h.type==='story')onStory(h);else if(h.type==='polity')onPolity(h);else onPerson(h);setQuery(h.name);setOpen(false)};
 const shown=open&&!!query.trim();
 return <div ref={box} className="atlas-search">
  <Search size={17} aria-hidden="true"/>
  <input type="search" placeholder="Find a story, person, empire or country…" value={query} role="combobox" aria-label="Find a story, person, empire or country" aria-expanded={shown} aria-controls="search-results" aria-activedescendant={shown&&hits[active]?`search-${hits[active].id}`:undefined} autoComplete="off" spellCheck={false}
   onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);setOpen(true)}}
   onKeyDown={e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);if(hits.length)setActive(i=>(i+(e.key==='ArrowDown'?1:hits.length-1))%hits.length)}
    else if(e.key==='Enter'&&shown&&hits[active]){e.preventDefault();pick(hits[active])}
    else if(e.key==='Escape'){setOpen(false)}
   }}/>
  {shown&&<ul id="search-results" role="listbox" aria-label="Stories, people and polities">
   {hits.map((h,i)=><li key={h.id} id={`search-${h.id}`} role="option" aria-selected={i===active} className={i===active?'active':''} onPointerEnter={()=>setActive(i)} onPointerDown={e=>{e.preventDefault();pick(h)}}>
    <strong>{h.name}</strong><span>{years(h)} · {h.subtitle}</span>{h.type==='story'?<small><BookOpen size={12}/> Play this story</small>:h.type==='polity'?<small><Landmark size={12}/> Show on the map</small>:h.place?<small><MapPin size={12}/> Born in {h.place}</small>:<small>No mapped birthplace</small>}
   </li>)}
   {!hits.length&&<li className="empty">{error?'People could not be loaded.':people?'Nothing by that name in the atlas.':'Loading people…'}</li>}
  </ul>}
 </div>;
}
