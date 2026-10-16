import {loadDataset} from '../domain/schema';
import type {Facet,PersonEntry,Tile} from '../domain/timeline';
// The people who made Space Time, shown alongside the imported people as an always-loaded tile.
// Lane -1 puts them in their own lane above every imported lane.
export const teamFacet:Facet={id:'team',label:'Space Time team',color:'#c9a227'};
const thisYear=new Date().getFullYear();
const members=[
 {key:'victor-eisenmann',name:'Victor Cardeal de Godoy Eisenmann',aliases:['Victor Eisenmann'],born:2013,place:'Sydney',position:[151.21,-33.87] as [number,number],role:'Co-creator of Space Time',note:'Co-creator of Space Time. Born 30 March 2013 in Sydney.'}
];
const subtitle=(role:string)=>`${role} · ${teamFacet.label}`;
export const team:Tile={
 dataset:loadDataset({schemaVersion:2,id:'dataset-team',title:'Space Time team',
  sources:[{id:'source-team',title:'Space Time team',localPath:'src/data/team.ts',accessed:'2026-10-07',licenseNote:'Locally authored; not an external historical source.'}],
  entities:members.map(m=>({id:`person-${m.key}`,name:m.name,kind:'person'})),
  spans:members.map(m=>({id:`life-${m.key}`,title:m.name,kind:'person-lifetime',interval:{start:{earliest:m.born,latest:m.born,precision:'year',certainty:'exact'},end:{earliest:thisYear,latest:thisYear,precision:'year',certainty:'exact'}},entityIds:[`person-${m.key}`],provenance:{sourceIds:['source-team'],status:'reviewed',method:'project team',note:`${m.note} Living, so the bar runs to ${thisYear}.`}})),
  places:[],events:[],features:[]}),
 lanes:Object.fromEntries(members.map(m=>[`life-${m.key}`,{facets:[teamFacet.id],lane:-1,score:100,subtitle:subtitle(m.role),living:true}]))
};
export const teamPeople:PersonEntry[]=members.map(m=>({id:`life-${m.key}`,name:m.name,aliases:m.aliases,born:m.born,died:thisYear,subtitle:subtitle(m.role),score:100,living:true,place:m.place,position:m.position}));
