// Playable stories are a presentation layer on top of spans: a classroom start, a
// calibrated time window, a map frame, and the chapters (spans) students play through.
// They are not extra historical claims; dates still live on the spans and events.
import {fromEra} from '../domain/schema';
import {centeredWindow} from '../domain/timeline';
import {bounds} from './catalog';

export type Story={
 id:string;
 title:string;
 aliases:string[];
 subtitle:string;
 spanIds:string[];
 // Landing year (timeline centre). from/to is the narrative students play.
 startYear:number;
 from:number;
 to:number;
 windowYears:number;
 map:{center:[number,number];zoom:number};
};

export const playable:Story[]=[
 {
  id:'story-macedon',
  title:'Macedonian Empire',
  aliases:['Alexander','Alexander the Great','Macedon','Macedonia',"Alexander's campaigns",'Philip II'],
  subtitle:'From Philip II to the successor wars',
  spanIds:['period-philip','campaign-alexander','period-successors'],
  // Alexander’s accession is the classroom hook; the window is wide enough that
  // Philip, Alexander’s lifetime and the successor wars all sit on the same stage.
  startYear:fromEra(336,'BCE'),from:fromEra(359,'BCE'),to:fromEra(301,'BCE'),windowYears:100,
  map:{center:[52,35],zoom:2.95}
 },
 {
  id:'story-ww2',
  title:'World War II',
  aliases:['WW2','WWII','Second World War','World War 2','World War Two'],
  subtitle:'From the war in China to Tokyo Bay',
  spanIds:['conflict-ww2'],
  // 1939 is the usual school start in Europe; 1937 (China) stays in the window.
  startYear:1939,from:1937,to:1945,windowYears:20,
  map:{center:[20,22],zoom:1.05}
 }
];

export const storySearch=playable.map(s=>({...s,name:s.title}));
export const storyOf=(spanId:string)=>playable.find(s=>s.spanIds.includes(spanId));
export const storyById=(id:string)=>playable.find(s=>s.id===id);

export function storyWindow(story:Story,year=story.startYear){
 return centeredWindow(year,story.windowYears,bounds);
}
export const inStory=(story:Story,year:number)=>story.from<=year&&year<=story.to;
