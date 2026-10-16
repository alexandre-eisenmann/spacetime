// History marks: moments and periods drawn across the whole timeline. Years follow each Wikipedia article's lead.
import {z} from 'zod';
import {dateSchema,fromEra} from '../domain/schema';
const markSchema=z.object({id:z.string().regex(/^[a-z][a-z0-9-]*$/),title:z.string().min(1),category:z.enum(['war','pandemic','event']),start:dateSchema,end:dateSchema,wikipedia:z.string().min(1),note:z.string()}).strict().refine(m=>m.start.latest<=m.end.earliest,'Mark dates must be ordered');
export type Mark=z.infer<typeof markSchema>;
const year=(n:number,certainty:'exact'|'approximate'='exact')=>({earliest:n,latest:n,precision:'year' as const,certainty});
const bce=(n:number)=>fromEra(n,'BCE');
type Row=[id:string,title:string,category:Mark['category'],start:number,end:number,wikipedia:string,note?:string,certainty?:'approximate'];
const rows:Row[]=[
 ['marathon','Battle of Marathon','war',bce(490),bce(490),'Battle_of_Marathon'],
 ['plague-athens','Plague of Athens','pandemic',bce(430),bce(426),'Plague_of_Athens'],
 ['peloponnesian-war','Peloponnesian War','war',bce(431),bce(404),'Peloponnesian_War'],
 ['second-punic-war','Second Punic War','war',bce(218),bce(201),'Second_Punic_War'],
 ['antonine-plague','Antonine Plague','pandemic',165,180,'Antonine_Plague'],
 ['fall-western-rome','Fall of the Western Roman Empire','event',476,476,'Fall_of_the_Western_Roman_Empire','Romulus Augustulus is deposed.'],
 ['plague-justinian','Plague of Justinian','pandemic',541,549,'Plague_of_Justinian','First wave of the first plague pandemic, which recurred until about 750.'],
 ['first-crusade','First Crusade','war',1096,1099,'First_Crusade'],
 ['hundred-years-war','Hundred Years’ War','war',1337,1453,'Hundred_Years%27_War'],
 ['black-death','Black Death','pandemic',1346,1353,'Black_Death','Opens the second plague pandemic, which recurred into the 19th century.'],
 ['fall-constantinople','Fall of Constantinople','event',1453,1453,'Fall_of_Constantinople'],
 ['columbus','Columbus reaches the Americas','event',1492,1492,'Voyages_of_Christopher_Columbus'],
 ['ninety-five-theses','Luther’s Ninety-five Theses','event',1517,1517,'Ninety-five_Theses'],
 ['thirty-years-war','Thirty Years’ War','war',1618,1648,'Thirty_Years%27_War'],
 ['industrial-revolution','Industrial Revolution','event',1760,1840,'Industrial_Revolution','Conventional dates for a gradual change.','approximate'],
 ['french-revolution','French Revolution','event',1789,1799,'French_Revolution'],
 ['napoleonic-wars','Napoleonic Wars','war',1803,1815,'Napoleonic_Wars'],
 ['third-plague','Third plague pandemic','pandemic',1855,1960,'Third_plague_pandemic','The WHO considered it active until 1960.'],
 ['world-war-i','World War I','war',1914,1918,'World_War_I'],
 ['influenza-1918','1918 influenza pandemic','pandemic',1918,1920,'Spanish_flu'],
 ['world-war-ii','World War II','war',1939,1945,'World_War_II'],
 ['cold-war','Cold War','war',1947,1991,'Cold_War'],
 ['moon-landing','Moon landing','event',1969,1969,'Apollo_11'],
 ['berlin-wall','Fall of the Berlin Wall','event',1989,1989,'Fall_of_the_Berlin_Wall'],
 ['september-11','September 11 attacks','event',2001,2001,'September_11_attacks'],
 ['covid-19','COVID-19 pandemic','pandemic',2020,2023,'COVID-19_pandemic','The WHO ended the global health emergency in May 2023.']
];
export const marks:Mark[]=rows.map(([id,title,category,s,e,wikipedia,note='',certainty])=>markSchema.parse({id:`mark-${id}`,title,category,start:year(s,certainty),end:year(e,certainty),wikipedia,note}));
export const markColors:Record<Mark['category'],string>={war:'#9b5c62',pandemic:'#7a7350',event:'#4f6f8f'};
export const isMoment=(m:Mark)=>m.start.earliest===m.end.latest;
