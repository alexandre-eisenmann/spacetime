// Curation adapter: original authored draft -> normalized, validated domain records.
// Rendering never imports the draft or this adapter's private source shape.
import {philip,events,successors,type HistoricalEvent} from './alexander-draft';
import {loadDataset,fromEra} from '../domain/schema';
import {polityEntity} from './polities';
const macedon=polityEntity('Macedonian Empire');
const heirs=['Ptolemaic Kingdom','Seleucid Empire','Kingdom of Lysimachus'].map(polityEntity);
const date=(signedYear:number,certainty:'exact'|'approximate'='exact')=>({earliest:fromEra(-signedYear,'BCE'),latest:fromEra(-signedYear,'BCE'),precision:'year',certainty});
const provenance=(sourceIds:string[],note:string)=>({sourceIds,status:'unreviewed',method:'original paraphrase',note});
const illustrative={sourceIds:['source-editorial'],status:'illustrative',method:'approximate reference coordinates',note:'Approximate editorial location for orientation, not surveyed event coordinates.'};
const spans:{id:string;title:string;kind:string;start:number;end:number;endExclusive?:boolean;entityIds:string[];events:HistoricalEvent[];sourceIds:string[];note:string}[]=[
 {id:'period-philip',title:'Macedon under Philip II',kind:'reign',start:-359,end:-336,endExclusive:true,entityIds:[macedon.id],events:philip,sourceIds:['source-met','source-whe'],note:'From Philip II’s accession to his murder in 336 BCE, which is assigned to Alexander’s reign. Chronology checked against references; independent scholarly review pending.'},
 {id:'campaign-alexander',title:'Alexander’s campaigns',kind:'campaign',start:-336,end:-323,entityIds:['person-alexander',macedon.id],events,sourceIds:['source-whe','source-met','source-ucl'],note:'Chronology checked against references; independent scholarly review pending.'},
 {id:'period-successors',title:'Wars of the successors',kind:'conflict',start:-322,end:-301,entityIds:[macedon.id,...heirs.map(e=>e.id)],events:successors,sourceIds:['source-diadochi'],note:'Alexander’s generals fight over his empire until the battle of Ipsus in 301 BCE fixes its division. On the map: the Macedonian Empire, the Ptolemaic Kingdom, the Seleucid Empire and the Kingdom of Lysimachus. Independent scholarly review pending.'}
];
const all=spans.flatMap(s=>s.events.map(e=>({e,s})));
export const alexander=loadDataset({schemaVersion:2,id:'dataset-alexander',title:'Alexander’s world',sources:[
 {id:'source-whe',title:'World History Encyclopedia — Alexander timeline',url:'https://www.worldhistory.org/timeline/Alexander_the_Great/',accessed:'2026-10-05',licenseNote:'Reference only; original paraphrased text, no copied media or geometry.'},
 {id:'source-met',title:'Metropolitan Museum — Rise of Macedon',url:'https://www.metmuseum.org/essays/the-rise-of-macedonia-and-the-conquests-of-alexander-the-great',accessed:'2026-10-05',licenseNote:'Reference only; no copied text or media.'},
 {id:'source-ucl',title:'UCL — Alexander in Egypt',url:'https://www.ucl.ac.uk/museums-static/digitalegypt/chronology/alexandergreat.html',accessed:'2026-10-05',licenseNote:'Reference for Egypt chronology only; no geometry.'},
 {id:'source-diadochi',title:'Wikipedia — Wars of the Diadochi',url:'https://en.wikipedia.org/wiki/Wars_of_the_Diadochi',accessed:'2026-10-07',licenseNote:'Chronology reference only; original paraphrased text.'},
 {id:'source-editorial',title:'Space Time prototype geometry',localPath:'src/data/alexander-draft.ts',accessed:'2026-10-05',licenseNote:'Locally authored prototype data; this identifier is not an external historical source.'}
],entities:[{id:'person-alexander',name:'Alexander III of Macedon',kind:'person'},macedon,...heirs],
 spans:spans.map(s=>({id:s.id,title:s.title,kind:s.kind,interval:{start:date(s.start),end:date(s.end),endExclusive:s.endExclusive??false},entityIds:s.entityIds,provenance:provenance(s.sourceIds,s.note)})),
 places:all.map(({e})=>({id:`place-alexander-${e.id}`,name:e.place,position:e.position,accuracy:'approximate',provenance:illustrative})),
 events:all.map(({e,s})=>({id:`event-alexander-${e.id}`,title:e.title,description:e.description,date:date(e.year,e.certainty),kind:e.kind,spanIds:[s.id],entityIds:s.entityIds,placeId:`place-alexander-${e.id}`,provenance:provenance(s.sourceIds,s.note)})),
 features:[]});
