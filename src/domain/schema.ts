import { z } from 'zod';
import {validRing} from './geometry';
// Astronomical year numbering internally: 0 = 1 BCE, -1 = 2 BCE, 1 = 1 CE.
export const dateSchema=z.object({earliest:z.number().int(),latest:z.number().int(),precision:z.literal('year'),certainty:z.enum(['exact','approximate','disputed'])}).strict().refine(d=>d.earliest<=d.latest,'Date bounds must be ordered').refine(d=>d.certainty!=='exact'||d.earliest===d.latest,'Exact dates need identical bounds');
const intervalSchema=z.object({start:dateSchema,end:dateSchema,endExclusive:z.boolean().default(false)}).strict().refine(d=>d.start.latest<=d.end.earliest,'Interval endpoints must be ordered and non-overlapping');
const id=z.string().regex(/^[a-z][a-z0-9-]*$/);
const provenance=z.object({sourceIds:z.array(id).min(1),status:z.enum(['illustrative','unreviewed','reviewed']),method:z.string().min(1),note:z.string().min(1)}).strict();
const coordinate=z.tuple([z.number().min(-180).max(180),z.number().min(-90).max(90)]);
const ring=z.array(coordinate).min(4).refine(r=>r[0][0]===r.at(-1)![0]&&r[0][1]===r.at(-1)![1],'Polygon rings must be closed').refine(validRing,'Polygon ring must have nonzero area and no crossing edges');
const geometry=z.discriminatedUnion('type',[z.object({type:z.literal('Polygon'),coordinates:z.array(ring).min(1)}).strict(),z.object({type:z.literal('MultiPolygon'),coordinates:z.array(z.array(ring).min(1)).min(1)}).strict(),z.object({type:z.literal('LineString'),coordinates:z.array(coordinate).min(2)}).strict(),z.object({type:z.literal('Point'),coordinates:coordinate}).strict()]);
export const datasetSchema=z.object({
 schemaVersion:z.literal(2),id,title:z.string().min(1),
 sources:z.array(z.object({id,title:z.string().min(1),url:z.string().url().optional(),localPath:z.string().optional(),accessed:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),licenseNote:z.string().min(1)}).strict()),
 entities:z.array(z.object({id,name:z.string().min(1),kind:z.enum(['person','polity','culture','place'])}).strict()),
 spans:z.array(z.object({id,title:z.string(),kind:z.enum(['campaign','conflict','person-lifetime','polity-phase','era','reign','cultural-period']),interval:intervalSchema,entityIds:z.array(id),provenance}).strict()),
 places:z.array(z.object({id,name:z.string(),position:coordinate,accuracy:z.enum(['approximate','exact']),provenance}).strict()),
 events:z.array(z.object({id,title:z.string(),description:z.string(),date:dateSchema,kind:z.enum(['battle','accession','arrival','death','cultural','political']),spanIds:z.array(id),entityIds:z.array(id),placeId:id,provenance}).strict()),
 features:z.array(z.object({id,title:z.string(),interval:intervalSchema,relation:z.enum(['campaign-extent','control','alliance','influence','route','cultural-area','reference-location']),mode:z.enum(['land','sea']).optional(),routeId:id.optional(),spanIds:z.array(id),entityIds:z.array(id),geometry,provenance}).strict())
}).strict().superRefine((d,ctx)=>{
 d.sources.forEach(s=>{if(!s.url&&!s.localPath)ctx.addIssue({code:'custom',message:`Source ${s.id} needs a URL or local path`})});
 const groups=[d.sources,d.entities,d.spans,d.places,d.events,d.features];const seen=new Set<string>();
 groups.flat().forEach(r=>{if(seen.has(r.id))ctx.addIssue({code:'custom',message:`Duplicate ID: ${r.id}`});seen.add(r.id)});
 const check=(refs:string[],group:{id:string}[],owner:string)=>refs.forEach(ref=>{if(!group.some(r=>r.id===ref))ctx.addIssue({code:'custom',message:`Unknown reference ${ref} in ${owner}`})});
 [...d.spans,...d.places,...d.events,...d.features].forEach(r=>check(r.provenance.sourceIds,d.sources,r.id));
 [...d.spans,...d.events,...d.features].forEach(r=>check(r.entityIds,d.entities,r.id));
 [...d.events,...d.features].forEach(r=>check(r.spanIds,d.spans,r.id));
 d.events.forEach(r=>check([r.placeId],d.places,r.id));
 d.spans.forEach(s=>{if(s.kind==='person-lifetime'&&!s.entityIds.some(id=>d.entities.some(e=>e.id===id&&e.kind==='person')))ctx.addIssue({code:'custom',message:`Lifetime ${s.id} requires a person`})});
 d.features.forEach(f=>{if(f.relation==='reference-location'&&f.geometry.type!=='Point')ctx.addIssue({code:'custom',message:'Reference locations must be points'})});
 // A line is always a route someone travelled, a leg of one named route; only routes say whether they went by land or sea.
 d.features.forEach(f=>{if((f.relation==='route')!==(f.geometry.type==='LineString'))ctx.addIssue({code:'custom',message:`${f.id}: routes, and only routes, are lines`});if((f.mode||f.routeId)&&f.relation!=='route')ctx.addIssue({code:'custom',message:`${f.id}: only routes have a travel mode or route id`});if(f.relation==='route'&&!f.routeId)ctx.addIssue({code:'custom',message:`${f.id}: a route leg needs its route id`})});
 d.features.forEach(r=>{if(r.relation==='campaign-extent'&&r.provenance.status==='reviewed'&&r.provenance.method==='hand-drawn schematic')ctx.addIssue({code:'custom',message:'Schematic campaign geometry cannot be marked reviewed'})});
});
export type HistoricalDataset=z.infer<typeof datasetSchema>;
export type HistoricalDate=z.infer<typeof dateSchema>;
export function loadDataset(input:unknown):HistoricalDataset{return datasetSchema.parse(input)}
export function fromEra(year:number,era:'BCE'|'CE'){if(!Number.isInteger(year)||year<1)throw new Error('Historical era years start at 1');return era==='BCE'?1-year:year}
export const formatYear=(year:number)=>`${year<=0?1-year:year} ${year<=0?'BCE':'CE'}`;

export function formatDate(date:HistoricalDate){const range=date.earliest===date.latest?formatYear(date.earliest):`${formatYear(date.earliest)} – ${formatYear(date.latest)}`;return date.certainty==='exact'?range:`${range} (${date.certainty})`}
