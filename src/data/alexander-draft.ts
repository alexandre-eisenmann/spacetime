export type HistoricalEvent = { id: string; year: number; certainty?: 'approximate'; title: string; place: string; position: [number, number]; kind: 'battle'|'accession'|'arrival'|'death'|'cultural'|'political'; description: string };
// Macedon before Alexander's accession.
export const philip: HistoricalEvent[] = [
 {id:'philip-king',year:-359,title:'Philip II becomes king',place:'Pella · Macedon',position:[22.52,40.76],kind:'accession',description:'Philip II takes the throne of Macedon, a kingdom on the northern edge of the Greek world, after his brother King Perdiccas III is killed fighting the Illyrians. He rebuilds the army around the phalanx: tight rows of foot soldiers armed with the sarissa, a pike up to six metres long.'},
 {id:'born',year:-356,title:'Alexander is born',place:'Pella · Macedon',position:[22.52,40.76],kind:'cultural',description:'Alexander, son of Philip II and Queen Olympias, a princess from Epirus, is born in Pella, the Macedonian capital.'},
 {id:'bucephalus',year:-344,certainty:'approximate',title:'Taming Bucephalus',place:'Pella · Macedon',position:[22.52,40.76],kind:'cultural',description:'According to the ancient writer Plutarch, the boy Alexander tames a wild horse no one else can ride by turning its head toward the sun, so it cannot see its own shadow. The horse, Bucephalus, will carry him all the way to India.'},
 {id:'aristotle',year:-343,certainty:'approximate',title:'A pupil of Aristotle',place:'Mieza · Macedon',position:[22.07,40.63],kind:'cultural',description:'Philip invites the philosopher Aristotle to teach the thirteen-year-old Alexander at Mieza, near Pella. For about three years Alexander studies philosophy, medicine and poetry; he loves Homer’s Iliad all his life.'},
 {id:'regent',year:-340,title:'Ruling at sixteen',place:'Pella · Macedon',position:[22.52,40.76],kind:'political',description:'While Philip besieges Byzantium, he leaves sixteen-year-old Alexander in charge of Macedon. Alexander puts down a revolt by a Thracian tribe and founds his first city, Alexandropolis.'},
 {id:'chaeronea',year:-338,title:'The battle of Chaeronea',place:'Chaeronea · Boeotia',position:[22.84,38.49],kind:'battle',description:'Philip defeats Athens and Thebes at Chaeronea, with eighteen-year-old Alexander leading the cavalry. Macedon is now the strongest power in Greece.'},
 {id:'corinth',year:-337,title:'The League of Corinth',place:'Corinth · Peloponnese',position:[22.93,37.91],kind:'political',description:'Philip unites the Greek cities, except Sparta, in the League of Corinth. The League names him its commander for a war against the Persian Empire.'}
];
// Alexander's reign. Events in the same year keep this order.
export const events: HistoricalEvent[] = [
 {id:'king',year:-336,title:'A young king',place:'Aegae · Macedon',position:[22.32,40.48],kind:'accession',description:'At his daughter’s wedding in Aegae, the old royal capital, Philip II is murdered by one of his own bodyguards. The army proclaims Alexander, aged twenty, king of Macedon.'},
 {id:'thebes',year:-335,title:'The fall of Thebes',place:'Thebes · Boeotia',position:[23.32,38.32],kind:'battle',description:'While Alexander campaigns in the north as far as the Danube, a false rumour of his death spreads and Thebes revolts. He storms the city and destroys it, sparing only the temples and the house of the poet Pindar. The other Greek cities submit.'},
 {id:'hellespont',year:-334,title:'Across the Hellespont',place:'Granicus · Asia Minor',position:[27.3,40.3],kind:'battle',description:'Alexander crosses the Hellespont into Asia with about 35,000 to 40,000 soldiers. At the river Granicus he defeats the army of the Persian governors and frees the Greek cities of the coast.'},
 {id:'gordium',year:-333,title:'The Gordian knot',place:'Gordium · Phrygia',position:[31.98,39.65],kind:'cultural',description:'At Gordium an ancient cart is tied with a knot no one can undo. Legend says whoever loosens it will rule Asia. Alexander, the story goes, cuts it with his sword.'},
 {id:'issus',year:-333,title:'The battle of Issus',place:'Issus · Cilicia',position:[36.2,36.8],kind:'battle',description:'Alexander defeats the Persian king Darius III at Issus. Darius flees, leaving behind his mother, wife and children, whom Alexander treats with respect. Instead of chasing him, Alexander turns south along the Mediterranean coast.'},
 {id:'tyre',year:-332,title:'The siege of Tyre',place:'Tyre · Phoenicia',position:[35.2,33.27],kind:'battle',description:'The island city of Tyre refuses to let Alexander in. His army builds a causeway across the sea to reach its walls and takes the city after a seven-month siege. Gaza falls next, after two months.'},
 {id:'egypt',year:-332,title:'Into Egypt',place:'Memphis · Egypt',position:[31.25,29.85],kind:'arrival',description:'The Persian governor of Egypt surrenders without a fight. At Memphis the Egyptians welcome Alexander as their new pharaoh.'},
 {id:'alexandria',year:-331,certainty:'approximate',title:'Alexandria is founded',place:'Alexandria · Egypt',position:[29.92,31.2],kind:'cultural',description:'On the Mediterranean coast of Egypt, Alexander founds Alexandria. With its lighthouse and great library, it will become one of the greatest cities of the ancient world.'},
 {id:'siwa',year:-331,certainty:'approximate',title:'The oracle of Siwa',place:'Siwa oasis · Egypt',position:[25.52,29.2],kind:'cultural',description:'Alexander crosses the desert to the oracle of the god Ammon at the Siwa oasis. The priest greets him as the son of the god, an honour Alexander will treasure for the rest of his life.'},
 {id:'gaugamela',year:-331,title:'The battle of Gaugamela',place:'Gaugamela · Mesopotamia',position:[43.5,36.4],kind:'battle',description:'On about 1 October, Alexander defeats a much larger Persian army at Gaugamela. Darius flees again. Babylon and Susa, two of the empire’s capitals, open their gates to Alexander.'},
 {id:'persepolis',year:-330,title:'Persepolis',place:'Persepolis · Persia',position:[52.89,29.93],kind:'arrival',description:'Alexander takes Persepolis, the ceremonial capital of the Persian kings, and its enormous treasure. Months later its great palace burns. Ancient writers disagree whether it was revenge for Persia’s burning of Athens in 480 BCE, or an accident at a feast.'},
 {id:'darius',year:-330,title:'The last Persian king',place:'near Hecatompylos · Parthia',position:[54.35,36.17],kind:'death',description:'As Alexander closes in, Darius III is killed by his own nobles, led by Bessus. Alexander gives him a royal funeral. The Persian Empire founded by Cyrus the Great 220 years earlier has ended, and Alexander rules in its place.'},
 {id:'eschate',year:-329,title:'Alexandria the Farthest',place:'Jaxartes · Sogdiana',position:[69.62,40.28],kind:'cultural',description:'Alexander crosses the Hindu Kush mountains, captures Bessus and founds Alexandria Eschate, “the Farthest”, on the Jaxartes river (today Khujand, Tajikistan). For two years he fights a hard war against the peoples of Bactria and Sogdiana.'},
 {id:'roxana',year:-327,title:'Roxana and the road to India',place:'Bactra · Bactria',position:[66.9,36.76],kind:'political',description:'Alexander marries Roxana, the daughter of a Bactrian noble, to win over the local lords. Then he crosses the Hindu Kush again and heads for India.'},
 {id:'hydaspes',year:-326,title:'The battle of the Hydaspes',place:'Hydaspes · Punjab',position:[73.5,32.8],kind:'battle',description:'Alexander crosses the flooded Hydaspes river by night and defeats King Porus and his war elephants. Impressed by Porus’s courage, he lets him keep his kingdom. Bucephalus dies soon after, and Alexander names a new city, Bucephala, after his horse.'},
 {id:'hyphasis',year:-326,title:'The army says no',place:'Hyphasis · Punjab',position:[75.0,31.6],kind:'political',description:'At the Hyphasis river (today the Beas) his soldiers, eight years and thousands of kilometres from home, refuse to march any farther east. Alexander gives in and turns back. It is the eastern limit of his empire.'},
 {id:'gedrosia',year:-325,title:'Through the desert',place:'Gedrosian desert',position:[63,26],kind:'arrival',description:'Alexander sails down the Indus to the ocean, after being badly wounded by an arrow in a siege. He then leads part of the army west through the Gedrosian desert, where heat and thirst kill many, while his fleet under Nearchus follows the coast.'},
 {id:'susa',year:-324,title:'The weddings at Susa',place:'Susa · Elam',position:[48.25,32.19],kind:'cultural',description:'To join Macedonians and Persians into one ruling class, Alexander marries Stateira, daughter of Darius III, and some eighty of his officers marry Persian noblewomen in a single ceremony.'},
 {id:'death',year:-323,title:'An unfinished empire',place:'Babylon · Mesopotamia',position:[44.42,32.54],kind:'death',description:'Alexander falls ill and dies in Babylon in June, aged 32, after reigning less than 13 years. His empire stretches from Greece and Egypt to the Indus. Legend says that when asked who should inherit it, he answered “the strongest”.'},
 {id:'partition',year:-323,title:'Who will rule?',place:'Babylon · Mesopotamia',position:[44.42,32.54],kind:'political',description:'The generals name two kings: Alexander’s half-brother Philip III and his son Alexander IV, born after his death. Perdiccas governs as regent, and the generals share out the provinces: Ptolemy takes Egypt, Lysimachus Thrace and Antigonus Phrygia in Asia Minor, while old Antipater keeps Macedon and Greece.'}
];
// Stops on the routes below, following Arrian's itinerary. Sites with a debated location (Thapsacus, the Persian
// Gates, Carmania's camp, the fleet's anchorages) use a commonly proposed one.
const at={
 pella:[22.52,40.76],amphipolis:[23.85,40.82],sestos:[26.4,40.23],troy:[26.24,39.96],granicus:[27.3,40.3],sardis:[28.04,38.49],miletus:[27.28,37.53],halicarnassus:[27.42,37.04],phaselis:[30.55,36.52],
 perge:[30.85,36.96],celaenae:[30.16,38.07],gordium:[31.98,39.65],ancyra:[32.86,39.93],cilicianGates:[34.77,37.29],tarsus:[34.9,36.92],issus:[36.2,36.8],
 marathus:[35.9,34.84],byblos:[35.65,34.12],sidon:[35.37,33.56],tyre:[35.2,33.27],gaza:[34.46,31.5],pelusium:[32.57,31.04],memphis:[31.25,29.85],
 alexandria:[29.92,31.2],paraetonium:[27.23,31.35],siwa:[25.52,29.2],thapsacus:[38.3,36.0],gaugamela:[43.5,36.4],arbela:[44.01,36.19],babylon:[44.42,32.54],susa:[48.25,32.19],
 persianGates:[51.6,30.7],persepolis:[52.89,29.93],ecbatana:[48.52,34.8],rhagae:[51.43,35.59],hecatompylos:[54.35,36.17],zadracarta:[54.43,36.84],artacoana:[62.2,34.35],phrada:[62.1,32.37],
 arachosia:[65.7,31.6],caucasus:[69.27,35.0],drapsaka:[68.86,36.73],bactra:[66.9,36.76],maracanda:[66.96,39.65],eschate:[69.62,40.28],nautaka:[66.83,39.05],
 nicaea:[70.45,34.43],peucelaotis:[71.73,34.15],taxila:[72.83,33.75],hydaspes:[73.5,32.8],hyphasis:[75.0,31.6],malli:[71.47,30.2],patala:[68.37,25.4],oreitae:[66.31,26.23],gedrosia:[63,26],pura:[60.47,27.2],carmania:[57.3,27.9],
 pasargadae:[53.18,30.2],opis:[44.5,33.25],
 indusMouth:[67.4,24.5],ormara:[64.63,25.2],gwadar:[62.33,25.12],chabahar:[60.64,25.29],harmozia:[57.08,27.15],qeshm:[56.0,26.75],kish:[54.0,26.55],bushehr:[50.83,28.97],karunMouth:[48.5,30.0],
 lysimachia:[26.75,40.55],lampsacus:[26.69,40.35],dorylaeum:[30.52,39.78],heraclea:[31.42,41.28],antigonia:[36.17,36.2],samosata:[38.52,37.53],mazaca:[35.48,38.73],ipsus:[31,38.6]
} satisfies Record<string,[number,number]>;
export type RouteDraft={id:string;title:string;mode?:'land'|'sea';span:'campaign-alexander'|'period-successors';start:[number,number];until:number;legs:{year:number;certainty?:'approximate';via:[number,number][]}[]};
export const routes:RouteDraft[]=[
 {id:'route-alexander',title:'Alexander’s army',span:'campaign-alexander',start:at.pella,until:-323,legs:[
  {year:-334,via:[at.amphipolis,at.sestos,at.troy,at.granicus,at.sardis,at.miletus,at.halicarnassus,at.phaselis]},
  {year:-333,via:[at.perge,at.celaenae,at.gordium,at.ancyra,at.cilicianGates,at.tarsus,at.issus]},
  {year:-332,via:[at.marathus,at.byblos,at.sidon,at.tyre,at.gaza,at.pelusium,at.memphis]},
  {year:-331,via:[at.alexandria,at.paraetonium,at.siwa,at.memphis,at.pelusium,at.gaza,at.tyre,at.thapsacus,at.gaugamela,at.arbela,at.babylon,at.susa]},
  {year:-330,via:[at.persianGates,at.persepolis,at.ecbatana,at.rhagae,at.hecatompylos,at.zadracarta,at.artacoana,at.phrada]},
  {year:-329,via:[at.arachosia,at.caucasus,at.drapsaka,at.bactra,at.maracanda,at.eschate]},
  {year:-328,via:[at.bactra,at.maracanda,at.nautaka]},
  {year:-327,via:[at.bactra,at.caucasus,at.nicaea]},
  {year:-326,via:[at.peucelaotis,at.taxila,at.hydaspes,at.hyphasis,at.hydaspes]},
  {year:-325,via:[at.malli,at.patala,at.oreitae,at.gedrosia,at.pura,at.carmania]},
  {year:-324,via:[at.pasargadae,at.persepolis,at.susa,at.opis,at.ecbatana]},
  {year:-323,via:[at.babylon]}
 ]},
 {id:'route-nearchus',title:'Nearchus’s fleet',mode:'sea',span:'campaign-alexander',start:at.patala,until:-323,legs:[
  {year:-325,via:[at.indusMouth,at.ormara,at.gwadar,at.chabahar,at.harmozia]},
  {year:-324,via:[at.qeshm,at.kish,at.bushehr,at.karunMouth,at.susa]}
 ]},
 {id:'route-seleucus',title:'Seleucus marches to Ipsus',span:'period-successors',start:at.babylon,until:-301,legs:[
  {year:-302,certainty:'approximate',via:[at.samosata,at.mazaca]},
  {year:-301,via:[at.ipsus]}
 ]},
 {id:'route-lysimachus',title:'Lysimachus marches to Ipsus',span:'period-successors',start:at.lysimachia,until:-301,legs:[
  {year:-302,via:[at.lampsacus,at.dorylaeum,at.heraclea]},
  {year:-301,via:[at.ipsus]}
 ]},
 {id:'route-antigonus',title:'Antigonus marches to Ipsus',span:'period-successors',start:at.antigonia,until:-301,legs:[
  {year:-302,via:[at.cilicianGates,at.dorylaeum]},
  {year:-301,via:[at.ipsus]}
 ]}
];
// The successors' wars, until the empire's division is settled at Ipsus.
export const successors: HistoricalEvent[] = [
 {id:'funeral',year:-321,certainty:'approximate',title:'A stolen funeral',place:'Memphis · Egypt',position:[31.25,29.85],kind:'political',description:'Ptolemy seizes Alexander’s funeral carriage on its way from Babylon and takes the body to Egypt; it later rests in Alexandria. The regent Perdiccas invades Egypt to punish him, but is killed by his own officers. The generals are now at war.'},
 {id:'olympias',year:-316,title:'Cassander takes Macedon',place:'Pydna · Macedon',position:[22.59,40.37],kind:'death',description:'Alexander’s mother Olympias has King Philip III killed. Cassander, son of the general Antipater, besieges her in Pydna, captures her and has her put to death. He now rules Macedon and holds the boy king Alexander IV.'},
 {id:'seleucus',year:-312,title:'Seleucus returns to Babylon',place:'Babylon · Mesopotamia',position:[44.42,32.54],kind:'political',description:'After the battle of Gaza, Seleucus retakes Babylon, which Antigonus had driven him from. From here he builds the largest of the successor kingdoms, reaching from Syria to Central Asia.'},
 {id:'argeads',year:-310,certainty:'approximate',title:'The end of Alexander’s family',place:'Amphipolis · Macedon',position:[23.85,40.82],kind:'death',description:'Cassander secretly has Alexander IV, about thirteen, and his mother Roxana killed. With no heir of Alexander left, the generals are free to rule in their own names.'},
 {id:'kings',year:-306,title:'The year of the kings',place:'Salamis · Cyprus',position:[33.9,35.18],kind:'political',description:'After a naval victory over Ptolemy at Salamis in Cyprus, Antigonus and his son Demetrius take the title of king. Ptolemy, Seleucus, Lysimachus and Cassander soon do the same.'},
 {id:'elephants',year:-305,certainty:'approximate',title:'Five hundred elephants',place:'Indus valley',position:[70.5,30.5],kind:'political',description:'Seleucus marches to India but makes peace with Chandragupta, founder of the Maurya Empire. He gives up the lands along the Indus and in today’s eastern Afghanistan in exchange for 500 war elephants.'},
 {id:'ipsus',year:-301,title:'The battle of Ipsus',place:'Ipsus · Phrygia',position:[31,38.6],kind:'battle',description:'Seleucus, with his elephants, and Lysimachus defeat Antigonus, who dies fighting at about eighty. Ptolemy keeps Egypt, Seleucus Syria and the east, Lysimachus most of Asia Minor and Cassander Macedon. Alexander’s empire is never reunited, but these kingdoms spread Greek language and culture from Egypt to Afghanistan until Rome conquers the last of them, Cleopatra’s Egypt, in 30 BCE.'}
];
