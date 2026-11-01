// Some hosted Workers forbid the Cache API. Source data must remain available.
export async function withOptionalCache(cache,key,load){
 let active=cache;
 try{const hit=await active?.match(key);if(hit)return hit;}catch{active=undefined;}
 const response=await load();
 if(active){try{await active.put(key,response.clone());}catch{}}
 return response;
}
