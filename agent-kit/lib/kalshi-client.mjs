// Queue ownership is per request. Never retain request-owned I/O promises in an isolate-global semaphore.
export function createKalshiClient(fetcher=fetch,delayMs=150){
 let inflight=0;const queue=[];
 return async function api(path){
  if(inflight>=2)await new Promise(resolve=>queue.push(resolve));inflight++;
  try{if(delayMs)await new Promise(resolve=>setTimeout(resolve,delayMs));
   for(let attempt=0;attempt<2;attempt++){
    const r=await fetcher('https://external-api.kalshi.com/trade-api/v2'+path,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
    if(r.status===429&&attempt===0){await r.text();await new Promise(resolve=>setTimeout(resolve,1200));continue;}
    if(!r.ok)throw Error('Kalshi HTTP '+r.status);return r.json();
   }throw Error('Rate limited');
  }finally{inflight--;queue.shift()?.();}
 };
}
