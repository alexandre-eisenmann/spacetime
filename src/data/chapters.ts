// Story chapters after the antiquity drafts: broad arcs of history, each with conventional start and end years.
// A chapter is about Cliopatria polities or groupings (parenthesised names); they are outlined on the world map while it is selected.
import {loadDataset,fromEra} from '../domain/schema';
import {polityEntity} from './polities';
const bce=(n:number)=>fromEra(n,'BCE');
type Row=[id:string,title:string,start:number,end:number,polities:string[],wikipedia:string,note:string,color:string];
const rows:Row[]=[
 ['warring-states','Warring States China',bce(475),bce(221),['(Warring States China)'],'Warring_States_period','Seven rival states contest the Zhou world until Qin unifies China in 221 BCE.','#7d6b52'],
 ['hellenistic','Hellenistic kingdoms',bce(323),bce(30),['Seleucid Empire','Ptolemaic Kingdom'],'Hellenistic_period','Alexander’s successors divide his conquests; the era closes when Rome annexes Ptolemaic Egypt.','#9a7a4f'],
 ['maurya','Maurya India',bce(322),bce(185),['Maurya Empire'],'Maurya_Empire','The first empire across most of the Indian subcontinent, under Chandragupta and Ashoka.','#a0704a'],
 ['parthia','Parthian Empire',bce(247),224,['Parthian Empire'],'Parthian_Empire','An Iranian empire of horse archers, rival of the Seleucids and then of Rome, until the Sasanians overthrow it.','#8e739a'],
 ['qin-han','Qin and Han China',bce(221),220,['Qin Dynasty','Han Dynasty'],'Han_dynasty','Unification under Qin, then four centuries of Han rule that shape Chinese government and identity.','#8b5e3c'],
 ['kushan','Kushan Empire',30,375,['Kushan Empire'],'Kushan_Empire','From Bactria to the Ganges plain, a crossroads of the Silk Road and of Buddhist, Greek and Indian art.','#9a6a4a'],
 ['late-rome','Later Roman Empire',138,476,['Roman Empire','Western Roman Empire','Eastern Roman Empire'],'Later_Roman_Empire','From the Antonines through the third-century crisis and Christianisation to the end of the western empire.','#a76166'],
 ['sasanian','Sasanian Persia',224,651,['Sasanian Empire'],'Sasanian_Empire','The last Persian empire before Islam, rival of Rome and Byzantium for four centuries.','#8e739a'],
 ['gupta','Gupta India',320,550,['Gupta Empire'],'Gupta_Empire','A classical age of Indian science, mathematics and literature.','#a0704a'],
 ['byzantium','Byzantium',476,1453,['Eastern Roman Empire','Byzantine Empire'],'Byzantine_Empire','The eastern Roman Empire continues from Constantinople for a thousand years after the west falls.','#7a5f8a'],
 ['caliphates','Rise of Islam and the caliphates',622,1258,['Rashidun Caliphate','Umayyad Caliphate','Abbasid Caliphate','Fatimid Caliphate','Caliphate of Córdoba'],'Caliphate','From Muhammad’s migration to Medina to the Mongol sack of Baghdad.','#4f7a62'],
 ['tang-song','Tang and Song China',618,1279,['Tang Dynasty','Northern Song','Southern Song'],'Tang_dynasty','Cosmopolitan Tang and commercial Song China: printing, paper money, gunpowder.','#8b5e3c'],
 ['tibet','Tibetan Empire',618,842,['Tibetan Empire'],'Tibetan_Empire','A plateau empire that contests Central Asia with Tang China and the Abbasids.','#7f6a8a'],
 ['franks','Frankish Europe',481,888,['(Merovingian Empire)','(Carolingian Empire)'],'Francia','From Clovis to Charlemagne and the division of his empire.','#6a7f9a'],
 ['vikings','Viking Age',793,1066,['Old Kingdom of Norway','Kingdom of Denmark','Kingdom of Sweden','Kievan Rus’'],'Viking_Age','Norse raiders, traders and settlers from Lindisfarne to the Battle of Stamford Bridge.','#5f7d8c'],
 ['turko-persian','Turko-Persian empires',977,1507,['Ghaznavid Empire','Great Seljuk Empire','Khwarezmid Empire','Timurid Empire'],'Turco-Persian_tradition','Turkic dynasties ruling through Persian culture, from the Ghaznavids and Seljuks to Timur and his heirs.','#6f7f5a'],
 ['mongols','Mongol Empire',1206,1368,['Mongol Empire','Golden Horde','Ilkhanate','Chagatai Khanate','Yuan Dynasty'],'Mongol_Empire','The largest contiguous land empire, from Genghis Khan to the fall of the Yuan.','#8a6a3f'],
 ['sahel','Mali and Songhai',1235,1591,['Mali Empire','Songhai Empire'],'Mali_Empire','Gold, salt and scholarship across the West African Sahel, from Sundiata to the fall of Songhai.','#a07a3a'],
 ['ethiopia','Ethiopian Empire',1270,1974,['Ethiopian Empire'],'Ethiopian_Empire','The Solomonic dynasty rules the Ethiopian highlands for seven centuries, resisting Italian conquest at Adwa.','#7a7a45'],
 ['ottomans','Rise of the Ottomans',1299,1683,['Ottoman Empire'],'Ottoman_Empire','From a frontier principality to the siege of Vienna.','#9b5c62'],
 ['ming-qing','Ming and Qing China',1368,1912,['Ming Dynasty','Qing Dynasty','Southern Ming'],'Ming_dynasty','Five centuries of Ming and then Manchu Qing rule until the last emperor abdicates.','#8b5e3c'],
 ['renaissance','Renaissance and Reformation',1400,1648,[],'Renaissance','Humanism, printing and religious reform reshape Europe until the Peace of Westphalia.','#b07c4f'],
 ['discovery','Age of Discovery',1415,1600,['Portuguese Empire','Spanish Empire'],'Age_of_Discovery','Iberian voyages link the oceans, from Ceuta to the Pacific crossings.','#3f7a72'],
 ['mughals','Mughal India',1526,1857,['Mughal Empire'],'Mughal_Empire','From Babur’s victory at Panipat to the end of the dynasty after 1857.','#a0704a'],
 ['colonial','Colonial empires',1600,1914,['(British Empire)','(Spanish Empire)','(Portuguese Empire)','(Dutch Republic)','Dutch East Indies'],'Colonial_empire','European trading companies and states build overseas empires across Asia, Africa and the Americas.','#4f6f8f'],
 ['revolutions','Age of Revolutions',1765,1848,['United States of America','(French First Republic)','(French Directory)','(French Consulate)','(First French Empire)'],'Age_of_Revolution','American, French, Haitian and Latin American revolutions remake ideas of the state.','#9b5c62'],
 ['industrial','Industrial and imperial age',1815,1914,['(British Empire)','German Empire','Russian Empire','Empire of Japan'],'Long_nineteenth_century','Steam, rail and telegraph; great-power rivalry and the scramble for Africa.','#5e6d7a'],
 ['world-wars','Age of world wars',1914,1945,['Nazi Germany','Empire of Japan','Union of Soviet Socialist Republics','United States of America'],'Interwar_period','Two world wars and the turbulent years between them.','#7a4a4f'],
 ['cold-war','Cold War and decolonisation',1945,1991,['Union of Soviet Socialist Republics','United States of America','People’s Republic of China'],'Cold_War','Superpower rivalry while most colonies become independent states.','#52637a'],
 ['global','Globalised world',1991,2026,['United States of America','People’s Republic of China'],'Globalization','After the Soviet collapse: the internet, global trade and a multipolar world.','#4f7f8f']
];
// Cliopatria spells these with a straight apostrophe.
const subjects=(names:string[])=>names.map(n=>polityEntity(n.replace('’',"'")));
export const chapterColors:Record<string,string>=Object.fromEntries(rows.map(([id,,,,,,,color])=>[`chapter-${id}`,color]));
const date=(n:number)=>({earliest:n,latest:n,precision:'year' as const,certainty:'approximate' as const});
const fmt=(n:number)=>n<=0?`${1-n} BCE`:`${n} CE`;
const shown=(names:string[])=>names.map(n=>n.replace(/^\((.*)\)$/,'$1 (all its territories)')).join(', ');
export const chapters=loadDataset({
 schemaVersion:2,id:'dataset-chapters',title:'Story chapters',
 sources:rows.map(([id,title,,,,wikipedia])=>({id:`source-chapter-${id}`,title:`Wikipedia — ${title}`,url:`https://en.wikipedia.org/wiki/${wikipedia}`,accessed:'2026-10-06',licenseNote:'Chronology summary only; conventional chapter dates, not a single historical boundary.'})),
 entities:[...new Map(rows.flatMap(([,,,,polities])=>subjects(polities)).map(e=>[e.id,e])).values()],
 spans:rows.map(([id,title,start,end,polities,,note])=>({id:`chapter-${id}`,title,kind:'era',interval:{start:date(start),end:date(end),endExclusive:false},entityIds:subjects(polities).map(e=>e.id),provenance:{sourceIds:[`source-chapter-${id}`],status:'unreviewed',method:'editorial chapter with conventional dates',note:`${note} Conventional dates ${fmt(start)} – ${fmt(end)}.${polities.length?` On the map: ${shown(polities)}.`:''}`}})),
 places:[],events:[],features:[]
});
