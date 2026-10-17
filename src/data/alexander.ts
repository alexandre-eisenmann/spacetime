// Curation adapter: original authored draft -> normalized, validated domain records.
// Rendering never imports the draft or this adapter's private source shape.
import {philip,events,successors,routes,type HistoricalEvent} from './alexander-draft';
import {fromEra} from '../domain/schema';
import {storyDataset,type StorySpan} from './story-dataset';
import {polityEntity} from './polities';
// The grouping also covers the regents Cliopatria maps as separate rows after Alexander’s death.
const macedon=polityEntity('(Macedonian Empire)');
const heirs=['Ptolemaic Kingdom','Seleucid Empire','Kingdom of Lysimachus'].map(polityEntity);
// The draft writes signed years (-336 for 336 BCE).
const year=(signed:number)=>fromEra(-signed,'BCE');
const asEvents=(list:HistoricalEvent[])=>list.map(e=>({...e,year:year(e.year)}));
const spans:StorySpan[]=[
 {id:'period-philip',title:'Macedon under Philip II',kind:'reign',start:year(-359),end:year(-336),endExclusive:true,entityIds:[macedon.id],events:asEvents(philip),sourceIds:['source-met','source-whe'],note:'From Philip II’s accession to his murder in 336 BCE, which is assigned to Alexander’s reign. Chronology checked against references; independent scholarly review pending.'},
 {id:'campaign-alexander',title:'Alexander’s campaigns',kind:'campaign',start:year(-336),end:year(-323),entityIds:['person-alexander',macedon.id],events:asEvents(events),sourceIds:['source-whe','source-met','source-ucl','source-wp-alexander'],note:'From Philip II’s murder to the division of the empire at Babylon. Chronology checked against references; anecdotes from ancient writers (Bucephalus, the Gordian knot, “the strongest”) are told as legends. Independent scholarly review pending.'},
 {id:'period-successors',title:'Wars of the successors',kind:'conflict',start:year(-322),end:year(-301),entityIds:[macedon.id,...heirs.map(e=>e.id)],events:asEvents(successors),sourceIds:['source-diadochi','source-wp-alexander'],note:'Alexander’s generals fight over his empire until the battle of Ipsus in 301 BCE fixes its division. On the map: the Macedonian Empire (in Cliopatria also the lands of Antigonus and of Cassander, with the regents Perdiccas, Laomedon and Polyperchon), the Ptolemaic Kingdom, the Seleucid Empire and the Kingdom of Lysimachus. Independent scholarly review pending.'}
];
const routeSources:Record<string,string[]>={'campaign-alexander':['source-wp-alexander','source-editorial'],'period-successors':['source-diadochi','source-editorial']};
export const alexander=storyDataset({key:'alexander',title:'Alexander’s world',editorialSourceId:'source-editorial',sources:[
 {id:'source-whe',title:'World History Encyclopedia — Alexander timeline',url:'https://www.worldhistory.org/timeline/Alexander_the_Great/',accessed:'2026-10-05',licenseNote:'Reference only; original paraphrased text, no copied media or geometry.'},
 {id:'source-met',title:'Metropolitan Museum — Rise of Macedon',url:'https://www.metmuseum.org/essays/the-rise-of-macedonia-and-the-conquests-of-alexander-the-great',accessed:'2026-10-05',licenseNote:'Reference only; no copied text or media.'},
 {id:'source-ucl',title:'UCL — Alexander in Egypt',url:'https://www.ucl.ac.uk/museums-static/digitalegypt/chronology/alexandergreat.html',accessed:'2026-10-05',licenseNote:'Reference for Egypt chronology only; no geometry.'},
 {id:'source-wp-alexander',title:'Wikipedia — Alexander the Great',url:'https://en.wikipedia.org/wiki/Alexander_the_Great',accessed:'2026-10-17',licenseNote:'Chronology reference only; original paraphrased text.'},
 {id:'source-diadochi',title:'Wikipedia — Wars of the Diadochi',url:'https://en.wikipedia.org/wiki/Wars_of_the_Diadochi',accessed:'2026-10-07',licenseNote:'Chronology reference only; original paraphrased text.'},
 {id:'source-editorial',title:'spacetime prototype geometry',localPath:'src/data/alexander-draft.ts',accessed:'2026-10-05',licenseNote:'Locally authored prototype data; this identifier is not an external historical source.'}
],entities:[{id:'person-alexander',name:'Alexander III of Macedon',kind:'person'},macedon,...heirs],spans,
 routes:routes.map(r=>({...r,until:year(r.until),legs:r.legs.map(l=>({...l,year:year(l.year)})),sourceIds:routeSources[r.span]})),
 routeNote:'Straight lines between the stops ancient writers record, one leg per year; the real paths followed rivers, roads and passes. Some stops have debated locations.'});
