export type HistoricalEvent = { id: string; year: number; certainty?: 'approximate'; title: string; place: string; position: [number, number]; kind: 'battle'|'accession'|'arrival'|'death'|'cultural'|'political'; description: string };
// Macedon before Alexander's accession.
export const philip: HistoricalEvent[] = [
 {id:'philip-king',year:-359,title:'Philip II becomes king',place:'Pella · Macedon',position:[22.52,40.76],kind:'accession',description:'Philip II takes the throne of Macedon, a kingdom on the northern edge of the Greek world. He rebuilds its army around the long-speared phalanx.'},
 {id:'born',year:-356,title:'Alexander is born',place:'Pella · Macedon',position:[22.52,40.76],kind:'cultural',description:'Alexander, son of Philip II and Olympias, is born in Pella, the Macedonian capital.'},
 {id:'aristotle',year:-343,certainty:'approximate',title:'A pupil of Aristotle',place:'Mieza · Macedon',position:[22.07,40.63],kind:'cultural',description:'Philip invites the philosopher Aristotle to teach the thirteen-year-old Alexander at Mieza, near Pella.'},
 {id:'chaeronea',year:-338,title:'The battle of Chaeronea',place:'Chaeronea · Boeotia',position:[22.84,38.49],kind:'battle',description:'Philip defeats Athens and Thebes at Chaeronea, with eighteen-year-old Alexander leading the cavalry. Macedon now leads the Greek cities.'}
];
// Alexander's reign. Events in the same year keep this order.
export const events: HistoricalEvent[] = [
 {id:'king',year:-336,title:'A young king',place:'Pella · Macedon',position:[22.52,40.76],kind:'accession',description:'Alexander succeeds Philip II as king of Macedon. A new chapter begins on the northern shores of the Aegean.'},
 {id:'hellespont',year:-334,title:'Across the Hellespont',place:'Granicus · Asia Minor',position:[27.3,40.3],kind:'battle',description:'Alexander crosses into Asia Minor and wins the Battle of the Granicus, opening his campaign against the Persian Empire.'},
 {id:'issus',year:-333,title:'The battle of Issus',place:'Issus · Cilicia',position:[36.2,36.8],kind:'battle',description:'Alexander defeats Darius III at Issus. His campaign turns south along the eastern Mediterranean.'},
 {id:'egypt',year:-332,title:'Into Egypt',place:'Memphis · Egypt',position:[31.25,29.85],kind:'arrival',description:'After the siege of Tyre, Alexander enters Egypt. His campaigns now connect the Aegean with the Nile.'},
 {id:'alexandria',year:-331,certainty:'approximate',title:'Alexandria is founded',place:'Alexandria · Egypt',position:[29.92,31.2],kind:'cultural',description:'On the Mediterranean coast of Egypt, Alexander founds Alexandria. It will become one of the great cities of the ancient world.'},
 {id:'gaugamela',year:-331,title:'The Persian turning point',place:'Gaugamela · Mesopotamia',position:[43.5,36.4],kind:'battle',description:'Victory at Gaugamela breaks Darius III’s hold on the empire. Alexander advances toward Babylon and the Persian heartland.'},
 {id:'persepolis',year:-330,title:'The Persian heartland',place:'Persepolis · Persia',position:[52.89,29.93],kind:'arrival',description:'Alexander reaches Persepolis. Campaigns continue eastward into the territories of the former Achaemenid Empire.'},
 {id:'hindu-kush',year:-327,title:'Beyond the Hindu Kush',place:'Bactria · Central Asia',position:[67,36.7],kind:'arrival',description:'Following campaigns in Bactria and Sogdiana, Alexander turns toward the Indian subcontinent.'},
 {id:'hydaspes',year:-326,title:'At the Hydaspes',place:'Hydaspes · Punjab',position:[73.5,32.8],kind:'battle',description:'Alexander fights King Porus at the Hydaspes. His army later refuses to advance farther east.'},
 {id:'death',year:-323,title:'An unfinished empire',place:'Babylon · Mesopotamia',position:[44.42,32.54],kind:'death',description:'Alexander dies in Babylon. The territories he conquered will become the focus of struggles between his successors.'}
];
// The successors' wars, until the empire's division is settled at Ipsus.
export const successors: HistoricalEvent[] = [
 {id:'funeral',year:-321,certainty:'approximate',title:'A stolen funeral',place:'Memphis · Egypt',position:[31.25,29.85],kind:'political',description:'Ptolemy, now ruling Egypt, seizes Alexander’s funeral procession on its way to Macedon and buries him in Egypt. Alexander’s generals are already at war.'},
 {id:'seleucus',year:-312,certainty:'approximate',title:'Seleucus returns to Babylon',place:'Babylon · Mesopotamia',position:[44.42,32.54],kind:'political',description:'Seleucus retakes Babylon. From here he builds the largest of the successor kingdoms, reaching from Syria to Central Asia.'},
 {id:'kings',year:-306,title:'The year of the kings',place:'Salamis · Cyprus',position:[33.9,35.18],kind:'political',description:'After a naval victory at Salamis in Cyprus, Antigonus and his son Demetrius take the title of king. Ptolemy, Seleucus, Lysimachus and Cassander soon do the same.'},
 {id:'ipsus',year:-301,title:'The battle of Ipsus',place:'Ipsus · Phrygia',position:[31,38.6],kind:'battle',description:'Antigonus dies fighting his rivals at Ipsus. No one will reunite Alexander’s empire; it stays divided among the successor kingdoms.'}
];
