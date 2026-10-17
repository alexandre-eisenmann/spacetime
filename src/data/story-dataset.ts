// Curation adapter shared by the playable stories: authored spans, their events and routes -> one validated dataset.
// Years are astronomical; each story converts its own draft years before calling this.
import {loadDataset,type HistoricalDataset} from '../domain/schema';
import {routeFeatures} from '../domain/routes';
type Point=[number,number];
export type StoryEvent={id:string;year:number;certainty?:'approximate';title:string;place:string;position:Point;kind:'battle'|'accession'|'arrival'|'death'|'cultural'|'political';description:string};
export type StorySpan={id:string;title:string;kind:'campaign'|'conflict'|'era'|'reign'|'polity-phase';start:number;end:number;endExclusive?:boolean;entityIds:string[];events:StoryEvent[];sourceIds:string[];note:string};
// `via` lists the stops reached in that year, in order; each route belongs to one of the story's spans.
export type StoryRoute={id:string;title:string;mode?:'land'|'sea';span:string;start:Point;until:number;legs:{year:number;certainty?:'approximate';via:Point[]}[];sourceIds:string[]};
export function storyDataset(story:{key:string;title:string;sources:HistoricalDataset['sources'];editorialSourceId:string;entities:HistoricalDataset['entities'];spans:StorySpan[];routes?:StoryRoute[];routeNote?:string}){
 const {key,spans,routes=[]}=story;
 const date=(n:number,certainty:'exact'|'approximate'='exact')=>({earliest:n,latest:n,precision:'year',certainty});
 const provenance=(sourceIds:string[],note:string)=>({sourceIds,status:'unreviewed',method:'original paraphrase',note});
 const located={sourceIds:[story.editorialSourceId],status:'illustrative',method:'approximate reference coordinates',note:'Approximate editorial location for orientation, not surveyed event coordinates.'};
 const all=spans.flatMap(s=>s.events.map(e=>({e,s})));
 if(routes.length&&!story.routeNote)throw new Error(`${key}: routes need a note on how they were drawn`);
 const features=routes.flatMap(r=>{
  const span=spans.find(s=>s.id===r.span);
  if(!span)throw new Error(`${r.id}: unknown span ${r.span}`);
  return routeFeatures({id:r.id,title:r.title,mode:r.mode,spanIds:[span.id],entityIds:span.entityIds,start:r.start,until:r.until,legs:r.legs,
   provenance:{sourceIds:r.sourceIds,status:'illustrative',method:'schematic route through attested stops',note:story.routeNote!}});
 });
 return loadDataset({schemaVersion:2,id:`dataset-${key}`,title:story.title,sources:story.sources,entities:story.entities,
  spans:spans.map(s=>({id:s.id,title:s.title,kind:s.kind,interval:{start:date(s.start),end:date(s.end),endExclusive:s.endExclusive??false},entityIds:s.entityIds,provenance:provenance(s.sourceIds,s.note)})),
  places:all.map(({e})=>({id:`place-${key}-${e.id}`,name:e.place,position:e.position,accuracy:'approximate',provenance:located})),
  events:all.map(({e,s})=>({id:`event-${key}-${e.id}`,title:e.title,description:e.description,date:date(e.year,e.certainty),kind:e.kind,spanIds:[s.id],entityIds:s.entityIds,placeId:`place-${key}-${e.id}`,provenance:provenance(s.sourceIds,s.note)})),
  features});
}
