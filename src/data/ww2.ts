// World War II as one conflict span with the turning points a school course meets first.
// Dates are years only; events in the same year keep the order of this list.
import {loadDataset} from '../domain/schema';
import {polityEntity} from './polities';
type Row=[key:string,year:number,title:string,place:string,position:[number,number],kind:'battle'|'political'|'arrival',description:string];
const rows:Row[]=[
 ['china',1937,'War in China','Beijing · China',[116.21,39.85],'battle','Japan invades China after a clash at the Marco Polo Bridge near Beijing. For China, the Second World War begins here.'],
 ['austria',1938,'Germany takes Austria','Vienna · Austria',[16.37,48.21],'political','Nazi Germany annexes Austria, then the Sudetenland of Czechoslovakia. Britain and France agree to it at Munich, hoping to avoid war.'],
 ['poland',1939,'The invasion of Poland','Warsaw · Poland',[21.01,52.23],'battle','Germany invades Poland on 1 September; the Soviet Union invades from the east. Britain and France declare war on Germany.'],
 ['france',1940,'The fall of France','Paris · France',[2.35,48.86],'battle','In six weeks Germany overruns the Netherlands, Belgium and France. The British army escapes from Dunkirk, and Italy joins the war on Germany’s side.'],
 ['britain',1940,'The Battle of Britain','London · Britain',[-0.13,51.51],'battle','The Royal Air Force holds off the German air force over Britain. Hitler postpones his invasion, and German bombers turn to night raids on British cities.'],
 ['barbarossa',1941,'Germany invades the Soviet Union','Brest · Soviet border',[23.69,52.1],'battle','Germany and its allies attack the Soviet Union in June. By December they reach the outskirts of Moscow, where the Red Army stops them.'],
 ['pearl-harbor',1941,'Pearl Harbor','Pearl Harbor · Hawaii',[-157.95,21.35],'battle','Japan attacks the United States fleet at Pearl Harbor on 7 December. The United States enters the war against Japan and Germany.'],
 ['midway',1942,'The battle of Midway','Midway · Pacific Ocean',[-177.37,28.21],'battle','The United States Navy sinks four Japanese aircraft carriers near Midway. Japan’s advance across the Pacific is halted.'],
 ['alamein',1942,'El Alamein','El Alamein · Egypt',[28.95,30.83],'battle','British and Commonwealth forces defeat the German and Italian army in Egypt and push it back across North Africa.'],
 ['stalingrad',1943,'Surrender at Stalingrad','Stalingrad · Soviet Union',[44.52,48.71],'battle','After five months of fighting in the city, the German Sixth Army surrenders at Stalingrad in February. Germany is now in retreat in the east.'],
 ['italy',1943,'Italy changes sides','Salerno · Italy',[14.77,40.68],'battle','The Allies land in Sicily and southern Italy. Mussolini is overthrown and Italy surrenders, but German troops occupy the north.'],
 ['normandy',1944,'D-Day','Normandy · France',[-0.6,49.34],'battle','On 6 June Allied armies land on the beaches of Normandy. Paris is liberated in August.'],
 ['auschwitz',1945,'Auschwitz is liberated','Auschwitz · Poland',[19.2,50.03],'arrival','Soviet soldiers reach Auschwitz, the largest Nazi death camp. In the Holocaust, Nazi Germany and its collaborators murdered six million Jews, and also Roma, disabled people and others.'],
 ['berlin',1945,'The fall of Berlin','Berlin · Germany',[13.4,52.52],'battle','Soviet troops take Berlin and Hitler kills himself. Germany surrenders on 8 May and the war in Europe is over.'],
 ['hiroshima',1945,'Hiroshima and Nagasaki','Hiroshima · Japan',[132.46,34.39],'battle','The United States drops atomic bombs on Hiroshima and Nagasaki in August, killing well over 100,000 people. The Soviet Union attacks Japanese forces in Manchuria.'],
 ['surrender',1945,'Japan surrenders','Tokyo Bay · Japan',[139.77,35.45],'political','Japan signs its surrender on 2 September aboard a United States battleship in Tokyo Bay. The Second World War is over.']
];
const axis=['Nazi Germany','Kingdom of Italy','Empire of Japan'].map(polityEntity);
const year=(n:number)=>({earliest:n,latest:n,precision:'year' as const,certainty:'exact' as const});
const provenance={sourceIds:['source-ww2-wikipedia','source-ww2-ushmm'],status:'unreviewed' as const,method:'original paraphrase',note:'Dates and summaries checked against the references; independent review pending.'};
const located={sourceIds:['source-ww2-editorial'],status:'illustrative' as const,method:'approximate reference coordinates',note:'Approximate location for orientation, not the extent of a battle or front.'};
export const ww2=loadDataset({schemaVersion:2,id:'dataset-ww2',title:'World War II',
 sources:[
  {id:'source-ww2-wikipedia',title:'Wikipedia — World War II',url:'https://en.wikipedia.org/wiki/World_War_II',accessed:'2026-10-07',licenseNote:'Chronology reference only; original paraphrased text.'},
  {id:'source-ww2-ushmm',title:'United States Holocaust Memorial Museum — World War II: key dates',url:'https://encyclopedia.ushmm.org/content/en/article/world-war-ii-key-dates',accessed:'2026-10-07',licenseNote:'Chronology reference only; no copied text or media.'},
  {id:'source-ww2-editorial',title:'Space Time reference coordinates',localPath:'src/data/ww2.ts',accessed:'2026-10-07',licenseNote:'Original approximate coordinates for orientation.'}
 ],
 entities:axis,
 spans:[{id:'conflict-ww2',title:'World War II',kind:'conflict',interval:{start:{earliest:1937,latest:1939,precision:'year',certainty:'disputed'},end:year(1945),endExclusive:false},entityIds:axis.map(e=>e.id),provenance:{...provenance,note:'The war began in 1937 in China and in 1939 in Europe, so the start is shown as disputed. On the map: the Axis powers (Nazi Germany, the Kingdom of Italy and the Empire of Japan) in each year. Independent review pending.'}}],
 places:rows.map(([key,,,place,position])=>({id:`place-ww2-${key}`,name:place,position,accuracy:'approximate',provenance:located})),
 events:rows.map(([key,y,title,,,kind,description])=>({id:`event-ww2-${key}`,title,description,date:year(y),kind,spanIds:['conflict-ww2'],entityIds:axis.map(e=>e.id),placeId:`place-ww2-${key}`,provenance})),
 features:[]
});
