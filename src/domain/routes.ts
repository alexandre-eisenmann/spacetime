// A route is the itinerary of one mover (an army, a fleet) as yearly legs. Each leg starts where the previous one
// ended and becomes a `route` LineString feature, valid from its year until the route ends, so the path builds up
// year by year while the story plays. Routes are authored, never inferred from the order of events.
import type {HistoricalDataset} from './schema';
type Feature=HistoricalDataset['features'][number];
type Point=[number,number];
export type Route={
 id:string;title:string;mode?:'land'|'sea';spanIds:string[];entityIds:string[];
 start:Point;
 // Astronomical years; `via` lists the attested stops reached in that year, in order.
 legs:{year:number;certainty?:'exact'|'approximate';via:Point[]}[];
 until:number;
 provenance:Feature['provenance'];
};
const year=(n:number,certainty:'exact'|'approximate'='exact')=>({earliest:n,latest:n,precision:'year' as const,certainty});
export function routeFeatures(route:Route):Feature[]{
 route.legs.forEach((leg,i)=>{
  if(!leg.via.length)throw new Error(`${route.id}: leg ${i+1} has no stops`);
  if(i&&leg.year<=route.legs[i-1].year)throw new Error(`${route.id}: legs must be in strictly increasing years`);
 });
 if(!route.legs.length||route.until<route.legs.at(-1)!.year)throw new Error(`${route.id}: a route ends after its last leg`);
 let from=route.start;
 return route.legs.map((leg,i)=>{
  const coordinates=[from,...leg.via];from=leg.via.at(-1)!;
  return {id:`${route.id}-${i+1}`,title:route.title,interval:{start:year(leg.year,leg.certainty),end:year(route.until),endExclusive:false},relation:'route',mode:route.mode??'land',routeId:route.id,spanIds:route.spanIds,entityIds:route.entityIds,geometry:{type:'LineString',coordinates},provenance:route.provenance};
 });
}
// The direction of travel at the end of a line, in degrees clockwise from north on a Web Mercator map.
export function arrivalBearing(line:number[][]){
 const [[x0,y0],[x1,y1]]=line.slice(-2);
 const merc=(lat:number)=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
 return (Math.atan2((x1-x0)*Math.PI/180,merc(y1)-merc(y0))*180/Math.PI+360)%360;
}
