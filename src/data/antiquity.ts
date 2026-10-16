import {loadDataset,fromEra} from '../domain/schema';
import {sources,places,spans,events,type DraftYear} from './antiquity-draft';
import {polityEntity} from './polities';
const date=(d:DraftYear)=>({earliest:fromEra(d.year,d.era),latest:fromEra(d.latestYear??d.year,d.era),precision:'year',certainty:d.certainty??'exact'});
const provenance=(source:string,note:string)=>({sourceIds:[source],status:'unreviewed',method:'original paraphrase / editorial coverage selection',note});
const locationProvenance={sourceIds:['source-antiquity-editorial'],status:'illustrative',method:'approximate reference coordinates',note:'Editorial point for orientation only, not a border or a surveyed event location. No territorial control or influence is inferred.'};
const subjects=(p:(typeof spans)[number])=>p.polities?p.polities.map(polityEntity):[{id:p.entity!,name:p.name!,kind:'polity' as const}];
const entityIds=(p:(typeof spans)[number])=>subjects(p).map(e=>e.id);
export const antiquity=loadDataset({schemaVersion:2,id:'dataset-antiquity',title:'Mediterranean and Persian histories',
 sources:[...sources.map(s=>({...s,accessed:'2026-10-05',licenseNote:'Chronological reference only; original concise paraphrases. No source artwork or geometry reproduced.'})),{id:'source-antiquity-editorial',title:'Spacetime editorial reference coordinates',localPath:'src/data/antiquity-draft.ts',accessed:'2026-10-05',licenseNote:'Original approximate coordinates for orientation.'}],
 entities:[...new Map(spans.flatMap(subjects).map(e=>[e.id,e])).values()],
 spans:spans.map(p=>({id:p.id,title:p.title,kind:'era',interval:{start:date(p.start),end:date(p.end),endExclusive:p.endExclusive??false},entityIds:entityIds(p),provenance:provenance(p.source,p.note)})),
 places:places.map(p=>({...p,accuracy:'approximate',provenance:locationProvenance})),
 events:events.map(e=>({id:e.id,title:e.title,description:e.description,date:date(e.date),kind:e.kind,spanIds:[e.period],entityIds:entityIds(spans.find(p=>p.id===e.period)!),placeId:e.place,provenance:provenance(e.source,'Date and summary sourced; independent scholarly review pending. Location may be a representative city; see description.')})),
 features:spans.map(p=>({id:`feature-${p.id}`,title:places.find(place=>place.id===p.place)!.name,interval:{start:date(p.start),end:date(p.end),endExclusive:p.endExclusive??false},relation:'reference-location',spanIds:[p.id],entityIds:entityIds(p),geometry:{type:'Point',coordinates:places.find(place=>place.id===p.place)!.position},provenance:locationProvenance}))
});
