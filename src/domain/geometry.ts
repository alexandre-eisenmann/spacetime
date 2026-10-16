// Simple-ring integrity at the import boundary; no claim of historical accuracy.
export function validRing(r:number[][]):boolean{
 if(r.length<4)return false;
 const cross=(a:number[],b:number[],c:number[])=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 let area=0;
 for(let i=0;i<r.length-1;i++){
  const a=r[i],b=r[i+1];if(a[0]===b[0]&&a[1]===b[1])return false;
  area+=a[0]*b[1]-b[0]*a[1];
  for(let j=i+2;j<r.length-1;j++){
   if(i===0&&j===r.length-2)continue;
   const c=r[j],d=r[j+1];
   if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return false;
  }
 }
 return Math.abs(area)>1e-8;
}
