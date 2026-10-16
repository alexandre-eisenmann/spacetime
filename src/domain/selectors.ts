import type {FeatureCollection} from 'geojson';
import {loadDataset, type HistoricalDataset,type HistoricalDate} from './schema';
export function occurredBy(date:HistoricalDate,year:number,mode:'possible'|'certain'='certain'){return (mode==='certain'?date.latest:date.earliest)<=year}
export function featuresAt(data:HistoricalDataset,year:number,spanId:string,mode:'possible'|'certain'='certain'):FeatureCollection {
 return {type:'FeatureCollection',features:data.features.filter(f=>f.spanIds.includes(spanId)&&(mode==='certain'?f.interval.start.latest<=year&&(f.interval.endExclusive?f.interval.end.earliest>year:f.interval.end.earliest>=year):f.interval.start.earliest<=year&&(f.interval.endExclusive?f.interval.end.latest>year:f.interval.end.latest>=year))).map(f=>({type:'Feature',id:f.id,properties:{title:f.title,relation:f.relation,status:f.provenance.status,sourceIds:f.provenance.sourceIds},geometry:f.geometry}))};
}
export function eventsFor(data:HistoricalDataset,spanIds:string[]){const ids=new Set(spanIds);return data.events.filter(e=>e.spanIds.some(id=>ids.has(id))).map(e=>{const place=data.places.find(p=>p.id===e.placeId)!;return {...e,year:e.date.latest,place:place.name,position:place.position}}).sort((a,b)=>a.year-b.year)}
export function eventViews(data:HistoricalDataset,spanId:string){return eventsFor(data,[spanId])}
export function latestEvent(data:HistoricalDataset,spanId:string,year:number){return eventsFor(data,[spanId]).filter(e=>occurredBy(e.date,year)).at(-1)}
export function timeWindow(year:number,span:number,bounds:[number,number]):[number,number]{const width=Math.min(span,bounds[1]-bounds[0]);const start=Math.max(bounds[0],Math.min(bounds[1]-width,year-Math.floor(width/2)));return [start,start+width]}

export type HistoricalSpan=HistoricalDataset['spans'][number];
export function intervalContains(interval:HistoricalSpan['interval'],year:number){return interval.start.latest<=year&&(interval.endExclusive?year<interval.end.earliest:year<=interval.end.earliest)}
export function spansInWindow(data:HistoricalDataset,start:number,end:number){return data.spans.filter(p=>p.interval.start.earliest<=end&&(p.interval.endExclusive?p.interval.end.latest>start:p.interval.end.latest>=start))}
export function activeSpans(data:HistoricalDataset,year:number){return data.spans.filter(p=>intervalContains(p.interval,year))}
export function mergeDatasets(datasets:HistoricalDataset[]):HistoricalDataset {
 // Re-validate globally: duplicate identifiers and broken cross-record references fail fast.
 // Entities are shared subjects, so the same entity may come from several datasets if every copy is identical.
 const entities=new Map<string,HistoricalDataset['entities'][number]>(),clashes:HistoricalDataset['entities']=[];
 for(const e of datasets.flatMap(d=>d.entities)){const seen=entities.get(e.id);if(!seen)entities.set(e.id,e);else if(JSON.stringify(seen)!==JSON.stringify(e))clashes.push(e)}
 return loadDataset({schemaVersion:2,id:'collection-antiquity',title:'Connected histories',sources:datasets.flatMap(d=>d.sources),entities:[...entities.values(),...clashes],spans:datasets.flatMap(d=>d.spans),places:datasets.flatMap(d=>d.places),events:datasets.flatMap(d=>d.events),features:datasets.flatMap(d=>d.features)});
}
export function combinedFeaturesAt(data:HistoricalDataset,year:number):FeatureCollection {
 const active=new Set(activeSpans(data,year).map(p=>p.id));
 return {type:'FeatureCollection',features:data.features.filter(f=>f.spanIds.some(id=>active.has(id))&&intervalContains(f.interval,year)).map(f=>({type:'Feature',id:f.id,properties:{title:f.title,spanId:f.spanIds.find(id=>active.has(id)),relation:f.relation,status:f.provenance.status},geometry:f.geometry}))};
}
