// The Inca story: from the kingdom of Cuzco to the fall of Vilcabamba, the last Inca state.
// Events in the same year keep the order of these lists.
import {storyDataset,type StoryEvent,type StorySpan} from './story-dataset';
import {polityEntity} from './polities';
const [cuzco,incaEmpire,chimu,spain]=['Cuzco','Inca Empire','Chimu Empire','(Spanish Empire)'].map(polityEntity);
// Stops on Pizarro’s third expedition, as his secretaries and companions recorded them.
const at={
 panama:[-79.52,8.95],coaque:[-80.1,0.03],puertoViejo:[-80.45,-1.05],puna:[-80.15,-2.85],tumbes:[-80.45,-3.57],sanMiguel:[-80.63,-5.19],
 cajamarca:[-78.51,-7.16],jauja:[-75.5,-11.77],cuzco:[-71.97,-13.52]
} satisfies Record<string,[number,number]>;
const kingdom:StoryEvent[]=[
 {id:'sun',year:1400,certainty:'approximate',title:'Children of the Sun',place:'Cuzco · Andes',position:at.cuzco,kind:'cultural',description:'High in the Andes mountains, the Inca are one of many peoples living around the valley of Cuzco. Their legend says the first Inca, Manco Cápac, and his sister Mama Ocllo were sent by the Sun god Inti from Lake Titicaca to found Cuzco. By about 1400, under rulers such as Viracocha Inca, Cuzco controls the valleys nearby.'}
];
const empire:StoryEvent[]=[
 {id:'pachacuti',year:1438,certainty:'approximate',title:'Pachacuti',place:'Cuzco · Andes',position:at.cuzco,kind:'battle',description:'The Chanka people attack Cuzco. The old king flees, but his son defends the city and wins. He takes the name Pachacuti, “he who turns the world upside down”, and begins to conquer the Andes. He rebuilds Cuzco in stone around the Coricancha, the Temple of the Sun, its walls covered in gold.'},
 {id:'machu-picchu',year:1450,certainty:'approximate',title:'Machu Picchu',place:'Machu Picchu · Andes',position:[-72.55,-13.16],kind:'cultural',description:'Machu Picchu is built on a mountain ridge above the Urubamba river, probably as a royal estate for Pachacuti. Its stones are cut to fit so tightly without mortar that a knife blade cannot slide between them. The Spaniards never find it.'},
 {id:'chimor',year:1470,certainty:'approximate',title:'The fall of Chimor',place:'Chan Chan · Pacific coast',position:[-79.07,-8.11],kind:'battle',description:'Pachacuti’s son Topa Inca conquers Chimor, the rich desert kingdom of the Chimú on the Pacific coast. Its capital, Chan Chan, is the largest city built of mud brick in the Americas. Chimú goldsmiths are taken to work in Cuzco.'},
 {id:'topa-inca',year:1471,certainty:'approximate',title:'Topa Inca',place:'Cuzco · Andes',position:at.cuzco,kind:'accession',description:'Topa Inca Yupanqui succeeds his father. His campaigns push the empire north to Quito and south deep into today’s Chile and Argentina, as far as the Maule river.'},
 {id:'huayna-capac',year:1493,certainty:'approximate',title:'Huayna Capac',place:'Tumebamba · Andes',position:[-79,-2.9],kind:'accession',description:'Huayna Capac becomes the Sapa Inca, “the only emperor”. He spends years at war in the north, in today’s Ecuador, ruling from Tumebamba and Quito. Tawantinsuyu, “the four parts together”, now runs some 4,000 km along the Andes and has perhaps ten million people.'},
 {id:'roads',year:1500,certainty:'approximate',title:'Roads, runners and knots',place:'Huánuco Pampa · Andes',position:[-76.62,-9.87],kind:'cultural',description:'A royal road network of about 30,000 km links the empire, with rope bridges over gorges and storehouses along the way. Relay runners, the chasquis, carry messages about 240 km a day. Officials keep records on quipus, cords tied with knots. There is no money: people pay their taxes in work.'},
 {id:'disease',year:1527,certainty:'approximate',title:'A deadly disease',place:'Quito · Andes',position:[-78.51,-0.22],kind:'death',description:'Huayna Capac dies of a new disease, probably smallpox, which has spread south from the Spanish colonies before any Spaniard arrives. His heir dies too. Two of his sons, Huáscar in Cuzco and Atahualpa in Quito, both claim the throne, and a civil war begins.'}
];
const conquest:StoryEvent[]=[
 {id:'civil-war',year:1532,title:'Atahualpa wins the civil war',place:'Quipaipan · near Cuzco',position:[-72.05,-13.55],kind:'battle',description:'Atahualpa’s generals defeat and capture Huáscar near Cuzco. Atahualpa, now the Sapa Inca, is resting at Cajamarca when news comes that bearded strangers have landed on the coast.'},
 {id:'cajamarca',year:1532,title:'Ambush at Cajamarca',place:'Cajamarca · Andes',position:at.cajamarca,kind:'battle',description:'On 16 November Francisco Pizarro, with about 170 Spaniards, invites Atahualpa to the town square of Cajamarca. The Spaniards attack his mostly unarmed escort with guns, steel swords and horses, kill thousands and take the emperor prisoner.'},
 {id:'ransom',year:1533,title:'A room full of gold',place:'Cajamarca · Andes',position:at.cajamarca,kind:'death',description:'Atahualpa promises to fill a room once with gold and twice with silver to be freed. The ransom is paid, much of it melted-down treasure, but the Spaniards execute him in July. In November they march into Cuzco.'},
 {id:'lima',year:1535,title:'The City of Kings',place:'Lima · Pacific coast',position:[-77.04,-12.05],kind:'political',description:'Pizarro founds Lima on the coast, close to the ships that link Peru with Panama and Spain. It becomes the capital of Spanish South America.'},
 {id:'manco',year:1536,title:'Manco Inca’s rebellion',place:'Sacsayhuamán · Cuzco',position:[-71.98,-13.51],kind:'battle',description:'Manco Inca, a son of Huayna Capac whom the Spaniards had made a puppet ruler, escapes and besieges Cuzco with a huge army for ten months. The siege fails, and in 1537 he withdraws to Vilcabamba in the forests, where Inca kings rule for 35 more years.'},
 {id:'last-inca',year:1572,title:'The last Inca',place:'Vilcabamba · Andes',position:[-73.21,-12.91],kind:'death',description:'Spanish forces take Vilcabamba, the last free Inca state. Túpac Amaru, the last Sapa Inca, is executed in the main square of Cuzco. Quechua, the language of the Inca, is still spoken by millions of people in the Andes today.'}
];
const sources=['source-wp-inca-empire'];
const spans:StorySpan[]=[
 {id:'period-cuzco',title:'The kingdom of Cuzco',kind:'polity-phase',start:1400,end:1437,entityIds:[cuzco.id],events:kingdom,sourceIds:sources,note:'Cuzco before its great expansion. Inca history before Pachacuti comes from legends recorded by Spanish chroniclers, so these dates are approximate. On the map: the kingdom of Cuzco. Independent review pending.'},
 {id:'period-inca',title:'Tawantinsuyu, the Inca Empire',kind:'polity-phase',start:1438,end:1530,entityIds:[cuzco.id,incaEmpire.id,chimu.id],events:empire,sourceIds:[...sources,'source-wp-machu-picchu'],note:'From Pachacuti’s victory over the Chanka to the eve of the Spanish conquest, in under a century the largest empire in the Americas. Reign dates follow the usual chronology and are approximate. On the map: the Inca Empire and the Chimú kingdom it conquered. Independent review pending.'},
 {id:'conquest-peru',title:'The Spanish conquest of the Inca Empire',kind:'conflict',start:1531,end:1572,entityIds:[incaEmpire.id,spain.id],events:conquest,sourceIds:['source-wp-conquest-peru',...sources],note:'From Pizarro’s third expedition to the fall of Vilcabamba. Cliopatria still maps a large Inca state until 1539, the years of Manco Inca’s rebellion, and then only Vilcabamba. On the map: the Inca Empire and the Spanish Empire. Independent review pending.'}
];
export const inca=storyDataset({key:'inca',title:'The Inca Empire',editorialSourceId:'source-inca-editorial',sources:[
 {id:'source-wp-inca-empire',title:'Wikipedia — Inca Empire',url:'https://en.wikipedia.org/wiki/Inca_Empire',accessed:'2026-10-17',licenseNote:'Chronology reference only; original paraphrased text.'},
 {id:'source-wp-machu-picchu',title:'Wikipedia — Machu Picchu',url:'https://en.wikipedia.org/wiki/Machu_Picchu',accessed:'2026-10-17',licenseNote:'Reference only; original paraphrased text.'},
 {id:'source-wp-conquest-peru',title:'Wikipedia — Spanish conquest of the Inca Empire',url:'https://en.wikipedia.org/wiki/Spanish_conquest_of_the_Inca_Empire',accessed:'2026-10-17',licenseNote:'Chronology reference only; original paraphrased text.'},
 {id:'source-inca-editorial',title:'spacetime reference coordinates',localPath:'src/data/inca.ts',accessed:'2026-10-17',licenseNote:'Original approximate coordinates for orientation.'}
],entities:[cuzco,incaEmpire,chimu,spain],spans,
 routes:[
  {id:'route-pizarro-ships',title:'Pizarro’s ships',mode:'sea',span:'conquest-peru',start:at.panama,until:1533,sourceIds:['source-wp-conquest-peru','source-inca-editorial'],legs:[{year:1531,via:[at.coaque]}]},
  {id:'route-pizarro',title:'Pizarro’s march',span:'conquest-peru',start:at.coaque,until:1533,sourceIds:['source-wp-conquest-peru','source-inca-editorial'],legs:[
   {year:1531,via:[at.puertoViejo,at.puna]},
   {year:1532,via:[at.tumbes,at.sanMiguel,at.cajamarca]},
   {year:1533,via:[at.jauja,at.cuzco]}
  ]}
 ],
 routeNote:'Straight lines between the stops Pizarro’s companions record, one leg per year; the real paths followed the coast and the Inca roads over the Andes.'});
