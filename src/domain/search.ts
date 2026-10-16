const fold=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
// Prefix matches first, then word starts, then anywhere; each group keeps the input order.
export function searchByName<T extends {name:string;aliases?:string[]}>(items:T[],query:string){
 const q=fold(query.trim());if(!q)return [];
 const starts:T[]=[],words:T[]=[],within:T[]=[];
 for(const p of items){const names=[p.name,...(p.aliases??[])].map(fold);if(names.some(n=>n.startsWith(q)))starts.push(p);else if(names.some(n=>n.includes(' '+q)))words.push(p);else if(names.some(n=>n.includes(q)))within.push(p)}
 return [...starts,...words,...within].slice(0,8);
}
