import {number} from './radar-core.mjs';
import {validUsername,weatherRecord,normalizeSocialTrades} from './trader-core.mjs';
const PROVIDER='https://predicting.top',SOCIAL='https://api.elections.kalshi.com/v1/social';
// Only fulfilled JSON is shared. In-flight queues belong to the current request.
const cache=new Map();
export function createTraderReader(fetcher=fetch){
 let running=0;const waiting=[];
 return async function read(url,ttl=300000){
  const hit=cache.get(url);if(hit&&Date.now()<hit.expires)return hit.data;
  if(running>=3)await new Promise(resolve=>waiting.push(resolve));running++;
  try{
   const r=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000)});
   if(!r.ok)throw Error('Provider HTTP '+r.status);
   const raw=await r.json();if(!raw||typeof raw!=='object')throw Error('Invalid provider JSON');
   const data={...raw,_fetchedAt:new Date().toISOString()};
   if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(url,{data,expires:Date.now()+ttl});return data;
  }finally{running--;waiting.shift()?.();}
 };
}
export async function loadTraderBoard(read=createTraderReader(),now=Date.now()){
 const boardUrl=PROVIDER+'/api/kalshi-leaderboard?period=30d&limit=100',board=await read(boardUrl);
 if(!Array.isArray(board.traders)||board.period!=='30d')throw Error('Leaderboard response changed');
 const all=board.traders.filter(t=>validUsername(t.kalshi_username));
 // Bounded discovery, not a claim to rank all weather traders. Unknown shares stay eligible.
 const candidates=all.filter(t=>number(t.sports_share)===null||number(t.sports_share)<.8).slice(0,18);
 const errors=[];let checked=0;
 const results=await Promise.all(candidates.map(async t=>{
  try{
   const url=PROVIDER+'/api/kalshi/'+encodeURIComponent(t.kalshi_username)+'/categories',record=weatherRecord(await read(url));checked++;
   if(!record.present)return null;
   const synced=Date.parse(t.last_synced_at),fresh=Number.isFinite(synced)&&now-synced>=0&&now-synced<=86400000;
   return {username:t.kalshi_username,weatherPnl:record.pnl,weatherMarkets:record.markets,overall30d:number(t.pnl),syncedAt:Number.isFinite(synced)?new Date(synced).toISOString():null,fresh,researchCandidate:fresh&&record.pnl>0&&record.markets>=30,sourceUrl:url,profileUrl:'https://kalshi.com/ideas/profiles/'+encodeURIComponent(t.kalshi_username)};
  }catch(e){errors.push(t.kalshi_username+': '+e.message);return null;}
 }));
 const traders=results.filter(Boolean).sort((a,b)=>(b.weatherPnl??-Infinity)-(a.weatherPnl??-Infinity));
 return {asOf:new Date(now).toISOString(),provider:'predicting.top',sourceUrl:boardUrl,providerUpdatedAt:board.lastUpdated||null,traders,errors,coverage:{pool:all.length,selected:candidates.length,checked,totalReported:board.total??null},method:'First 18 traders with sports share below 80% (or unknown), from the top 100 by reported 30-day overall P&L. Sorted here by reported all-time Climate and Weather P&L. Partial, opt-in coverage; no weather-only global ranking.'};
}
export async function loadTraderActivity(username,read=createTraderReader(),now=Date.now()){
 if(!validUsername(username))throw Error('Invalid Kalshi username');
 const path=SOCIAL+'/trades?nickname='+encodeURIComponent(username)+'&page_size=100';
 const payload=await read(path,15000);
 // A public profile response can explicitly resolve a renamed nickname. Never infer identity from avatars or similar names.
 let canonical=username,identity='requested';
 const hasNamed=Array.isArray(payload.trades)&&payload.trades.some(t=>t.maker_nickname||t.taker_nickname);
 if(hasNamed&&!payload.trades.some(t=>t.maker_nickname===username||t.taker_nickname===username)){
  const p=await read(SOCIAL+'/profile?nickname='+encodeURIComponent(username));
  if(!validUsername(p.social_profile?.nickname))throw Error('Profile identity could not be resolved');
  canonical=p.social_profile.nickname;identity='profile-resolved';
 }
 return {username,canonical,identity,sourceUrl:path,asOf:payload._fetchedAt||new Date(now).toISOString(),...normalizeSocialTrades(payload,canonical,now)};
}
