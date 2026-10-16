// Editorial input, not renderer configuration. BCE/CE is explicit at this boundary.
export type DraftYear={year:number;era:'BCE'|'CE';certainty?:'exact'|'approximate'|'disputed';latestYear?:number};
export const bce=(year:number):DraftYear=>({year,era:'BCE'});
export const ce=(year:number):DraftYear=>({year,era:'CE'});
export const sources=[
 {id:'source-republic-whe',title:'World History Encyclopedia — Roman Republic',url:'https://www.worldhistory.org/Roman_Republic/'},
 {id:'source-persia-met',title:'The Met — The Achaemenid Persian Empire',url:'https://www.metmuseum.org/essays/the-achaemenid-persian-empire-550-330-b-c'},
 {id:'source-greece-met',title:'The Met — The Art of Classical Greece',url:'https://www.metmuseum.org/essays/the-art-of-classical-greece-ca-480-323-b-c'},
 {id:'source-war-whe',title:'World History Encyclopedia — Peloponnesian War',url:'https://www.worldhistory.org/Peloponnesian_War/'},
 {id:'source-leuctra-whe',title:'World History Encyclopedia — Battle of Leuctra',url:'https://www.worldhistory.org/Battle_of_Leuctra/'},
 {id:'source-republic-met',title:'The Met — Roman Art: A Resource for Educators',url:'https://resources.metmuseum.org/resources/metpublications/pdf/Roman_Art_A_Resource_for_Educators.pdf'},
 {id:'source-empire-met',title:'The Met — The Roman Empire',url:'https://www.metmuseum.org/essays/the-roman-empire-27-b-c-393-a-d'}
];
export const places=[
 {id:'place-athens',name:'Athens · Attica',position:[23.73,37.98]},
 {id:'place-sparta',name:'Sparta · Laconia',position:[22.43,37.08]},
 {id:'place-leuctra',name:'Leuctra · Boeotia',position:[23.18,38.25]},
 {id:'place-pasargadae',name:'Pasargadae · Persia',position:[53.18,30.2]},
 {id:'place-persian-babylon',name:'Babylon · Mesopotamia',position:[44.42,32.54]},
 {id:'place-persian-memphis',name:'Memphis · Egypt',position:[31.25,29.85]},
 {id:'place-rome',name:'Rome · Italy',position:[12.49,41.89]},
 {id:'place-carthage',name:'Carthage · North Africa',position:[10.32,36.85]}
];
// Subjects are Cliopatria polities; Athens and Sparta are not in Cliopatria, so they are their own entities.
export const spans=[
 {id:'period-persia',title:'Achaemenid Persia',polities:['Achaemenid Empire'],start:bce(550),end:bce(330),place:'place-pasargadae',source:'source-persia-met',note:'Conventional dynastic span, 550–330 BCE. Pasargadae is a reference site, not the location of every event or the only imperial capital.'},
 {id:'period-athens',title:'Athens · fifth century',entity:'polity-athens',name:'Athens',start:bce(480),end:bce(404),place:'place-athens',source:'source-greece-met',note:'Selected chapter from the Persian Wars to defeat in 404 BCE, not the lifespan of Athens. Athens and Sparta were distinct city-states; no unified Greek Empire is represented.'},
 {id:'period-sparta',title:'Sparta · classical power',entity:'polity-sparta',name:'Sparta',start:bce(480),end:bce(362),place:'place-sparta',source:'source-leuctra-whe',note:'Editorial coverage window from 480 BCE through the aftermath of Leuctra and the loss of Messenia, not the founding or disappearance of Sparta.'},
 {id:'period-republic',title:'Roman Republic',polities:['Roman Republic','Roman Empire'],start:{...bce(509),certainty:'approximate' as const},end:bce(27),endExclusive:true,place:'place-rome',source:'source-republic-met',note:'509 BCE is the traditional beginning. At year resolution, 27 BCE is assigned to the imperial chapter; the transition was political and occurred within that year.'},
 {id:'period-empire',title:'Early Roman Empire',polities:['Roman Empire'],start:bce(27),end:ce(138),place:'place-rome',source:'source-empire-met',note:'An introductory selection from Augustus through Hadrian’s reign. The Roman Empire continued after 138 CE; this is a coverage cutoff, not its fall.'}
];
export const events=[
 {id:'event-persia-cyrus',title:'Cyrus defeats Media',description:'Cyrus defeats the Median king Astyages in 550 BCE, a conventional starting point for the Achaemenid Empire. The map shows a Persian reference site, not the battle location.',date:bce(550),period:'period-persia',place:'place-pasargadae',source:'source-persia-met',kind:'political'},
 {id:'event-persia-babylon',title:'Cyrus enters Babylon',description:'Babylon comes under Persian rule in 539 BCE.',date:bce(539),period:'period-persia',place:'place-persian-babylon',source:'source-persia-met',kind:'arrival'},
 {id:'event-persia-egypt',title:'Cambyses conquers Egypt',description:'Persian forces take Memphis in 525 BCE under Cambyses.',date:bce(525),period:'period-persia',place:'place-persian-memphis',source:'source-persia-met',kind:'battle'},
 {id:'event-athens-treasury',title:'The treasury moves to Athens',description:'The Delian League treasury moves from Delos to Athens. The source gives 454/453 BCE; this event is anchored at the later bound rather than claiming a precise year.',date:{...bce(454),latestYear:453,certainty:'approximate' as const},period:'period-athens',place:'place-athens',source:'source-greece-met',kind:'political'},
 {id:'event-athens-war',title:'War with Sparta',description:'Athens and Sparta, with their respective allies, enter the Peloponnesian War in 431 BCE.',date:bce(431),period:'period-athens',place:'place-athens',source:'source-war-whe',kind:'political'},
 {id:'event-athens-defeat',title:'Athens surrenders',description:'Athens surrenders in 404 BCE, ending the war. The city continues to exist beyond this chapter.',date:bce(404),period:'period-athens',place:'place-athens',source:'source-war-whe',kind:'political'},
 {id:'event-sparta-war',title:'Sparta leads its alliance',description:'Sparta and its allies fight the Athenian alliance in the war beginning in 431 BCE.',date:bce(431),period:'period-sparta',place:'place-sparta',source:'source-war-whe',kind:'political'},
 {id:'event-sparta-victory',title:'Spartan ascendancy',description:'Victory over Athens in 404 BCE establishes Spartan predominance, but not a unified Greek state.',date:bce(404),period:'period-sparta',place:'place-sparta',source:'source-war-whe',kind:'political'},
 {id:'event-sparta-leuctra',title:'Defeat at Leuctra',description:'Thebes defeats Sparta in 371 BCE. This chapter ends at a major reversal in Spartan power, not the end of the city.',date:bce(371),period:'period-sparta',place:'place-leuctra',source:'source-leuctra-whe',kind:'battle'},
 {id:'event-republic-origin',title:'A traditional beginning',description:'509 BCE is the traditional date for the beginning of the Roman Republic. Early chronology is less secure than this single-year convention suggests.',date:{...bce(509),certainty:'approximate' as const},period:'period-republic',place:'place-rome',source:'source-republic-met',kind:'political'},
 {id:'event-republic-carthage',title:'Carthage falls',description:'Rome destroys Carthage in 146 BCE, at the end of the Third Punic War.',date:bce(146),period:'period-republic',place:'place-carthage',source:'source-republic-whe',kind:'battle'},
 {id:'event-empire-augustus',title:'Octavian becomes Augustus',description:'The Senate awards Octavian the title Augustus in 27 BCE, the conventional beginning of the imperial period.',date:bce(27),period:'period-empire',place:'place-rome',source:'source-empire-met',kind:'accession'},
 {id:'event-empire-tiberius',title:'Tiberius succeeds Augustus',description:'Tiberius becomes emperor in 14 CE, continuing the Julio-Claudian dynasty.',date:ce(14),period:'period-empire',place:'place-rome',source:'source-empire-met',kind:'accession'},
 {id:'event-empire-hadrian',title:'Hadrian succeeds Trajan',description:'Hadrian becomes emperor in 117 CE. His reign sees consolidation and withdrawal from Trajan’s eastern conquests.',date:ce(117),period:'period-empire',place:'place-rome',source:'source-empire-met',kind:'accession'}
];
