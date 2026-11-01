import {flow,earlyFlow,number,bookSide,signalStage,fee} from '../../../lib/radar-core.mjs';
import {createKalshiClient} from '../../../lib/kalshi-client.mjs';
const SERIES=[['KXHIGHNY','New York'],['KXHIGHCHI','Chicago'],['KXHIGHMIA','Miami'],['KXHIGHLAX','Los Angeles'],['KXHIGHAUS','Austin'],['KXHIGHDEN','Denver'],['KXHIGHPHIL','Philadelphia']];
const metaCache=new Map<string,{expires:number,data:any}>();
async function metadata(s:string,api:(path:string)=>Promise<any>){const c=metaCache.get(s);if(c&&c.expires>Date.now())return c.data;const d=await api('/series/'+s);metaCache.set(s,{data:d,expires:Date.now()+3600000});return d;}
function bounded(p:URLSearchParams,k:string,d:number,lo:number,hi:number){return Math.max(lo,Math.min(hi,number(p.get(k),d)));}
export async function GET(req:Request){
 const api=createKalshiClient() as (path:string)=>Promise<any>;
 const start=Date.now(),p=new URL(req.url).searchParams;
 const c={minPrice:bounded(p,'minPrice',.55,.1,.99),maxPrice:bounded(p,'maxPrice',.95,.1,.99),min24:bounded(p,'min24',250,0,1e9),maxSpread:bounded(p,'maxSpread',.03,.001,.25),min5:bounded(p,'min5',100,1,1e7),ratio:bounded(p,'ratio',2,1,100),min1:bounded(p,'min1',25,1,1e7),earlyRatio:bounded(p,'earlyRatio',3,1,100),minBaseline:25,confirmMin:.75,minMinutes:30,quantity:10};
 const errors:string[]=[],rows:any[]=[];let successfulSeries=0;
 await Promise.all(SERIES.map(async([s,city])=>{try{
 const [d,meta]=await Promise.all([api('/markets?status=open&limit=1000&series_ticker='+s),metadata(s,api)]);const series=meta.series;if(!/weather|climate/i.test(series.category||''))throw Error('Weather category not verified');successfulSeries++;if(d.cursor)errors.push(city+': market list truncated');
 for(const m of d.markets||[]){if(m.market_type!=='binary'||!['active','open'].includes(m.status)||Date.parse(m.close_time)<=Date.now())continue;
 for(const side of ['yes','no']){const ask=number(m[side+'_ask_dollars']);if(ask===null||ask<c.minPrice||ask>c.maxPrice||number(m.volume_24h_fp,0)<c.min24)continue;
 rows.push({ticker:m.ticker,event:m.event_ticker,series:s,city,title:m.title,subtitle:m.yes_sub_title,side,ask,bid:number(m[side+'_bid_dollars']),volume24:number(m.volume_24h_fp,0),close:m.close_time,rules:m.rules_primary,secondary:m.rules_secondary,stationProduct:(m.rules_primary||'').match(/\((CLI[A-Z]+)\)/)?.[1]||null,source:/weather company/i.test(m.rules_primary||'')?'The Weather Company':/national weather service|NWS/i.test(m.rules_primary||'')?'NWS':'Review rules',sources:series.settlement_sources||[],feeType:series.fee_type,coefficient:series.fee_type==='quadratic'?.07*number(series.fee_multiplier,1):null,audited:false,stage:'QUEUED'});
 }}
 }catch(e:any){errors.push(city+': '+e.message);}}));
 rows.sort((a,b)=>b.volume24-a.volume24);
 const unique:any[]=[...new Map(rows.map(r=>[r.ticker,r])).values()],audit:any[]=[];const add=(r:any)=>{if(r&&!audit.some(x=>x.ticker===r.ticker)&&audit.length<12)audit.push(r)};
 // Four volume leaders, city coverage, then a deterministic rotating slot. Same-ticker sides share requests.
 add(unique.find(r=>r.ticker===p.get('focus')));unique.slice(0,4).forEach(add);for(const [,city]of SERIES)add(unique.find(r=>r.city===city));
 const offset=unique.length?Math.floor(start/15000)%unique.length:0;for(let i=0;i<unique.length&&audit.length<12;i++)add(unique[(offset+i)%unique.length]);
 await Promise.all(audit.map(async(candidate)=>{const related=rows.filter(r=>r.ticker===candidate.ticker);try{
 const [d,bookResult]=await Promise.all([api('/markets/trades?limit=1000&ticker='+encodeURIComponent(candidate.ticker)+'&min_ts='+Math.floor((Date.now()-600000)/1000)),api('/markets/'+encodeURIComponent(candidate.ticker)+'/orderbook?depth=10').then(data=>({data,received:Date.now()}))]);const received=bookResult.received,b=bookResult.data,tapeNow=Date.now();
 for(const row of related){Object.assign(row,flow(d.trades||[],tapeNow),earlyFlow(d.trades||[],tapeNow),{complete:!d.cursor,book:bookSide(b.orderbook_fp,row.side),audited:true,received});row.stage=signalStage(row,c,tapeNow);row.alert=['EARLY','CONFIRMED'].includes(row.stage);row.feeEstimate=row.book&&row.coefficient!==null?fee(row.book.ask,10,row.coefficient):null;row.reason=!row.complete?'Trade window incomplete':!row.book?'Two-sided book missing':row.book.depth<10?'Insufficient depth':Date.parse(row.close)-received<1800000?'Too close to market close':row.alert?(row.stage==='EARLY'?'One-minute activity acceleration':'Five-minute flow confirmation'):row.baseline<25?'Insufficient early baseline':'Flow or liquidity gates not met';}
 }catch(e:any){for(const r of related){r.reason=e.message;r.alert=false;r.stage='ERROR';}errors.push(candidate.city+' audit '+candidate.ticker+': '+e.message);}}));
 // An older audit is visibly stale even if other queued requests completed later.
 for(const row of rows){if(row.audited&&Date.now()-row.received>15000){row.stage='STALE';row.alert=false;row.reason='Book audit older than 15 seconds';}}
 return Response.json({asOf:new Date().toISOString(),latencyMs:Date.now()-start,version:2,config:c,rows,errors,coverage:{series:7,candidates:rows.length,audited:rows.filter(r=>r.audited).length,uniqueAudits:audit.length,totalUnique:unique.length},successfulSeries,mode:'public-rest'},{headers:{'Cache-Control':'no-store'}});
}
