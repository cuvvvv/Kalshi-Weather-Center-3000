import {number} from './radar-core.mjs';

export const WEATHER_SERIES=['KXHIGHNY','KXHIGHCHI','KXHIGHMIA','KXHIGHLAX','KXHIGHAUS','KXHIGHDEN','KXHIGHPHIL'];
export const validUsername=v=>typeof v==='string'&&/^[A-Za-z0-9_.-]{1,64}$/.test(v);
export const weatherTicker=v=>typeof v==='string'&&WEATHER_SERIES.some(s=>v.startsWith(s+'-'));
export function weatherRecord(payload){
 if(!Array.isArray(payload?.categories))throw Error('Category response changed');
 const rows=payload.categories.filter(c=>['weather','climate','climate and weather','climate & weather'].includes(String(c.category).toLowerCase()));
 if(!rows.length)return {pnl:null,markets:null,present:false};
 const pnls=rows.map(r=>number(r.pnl)),counts=rows.map(r=>number(r.markets));
 return {pnl:pnls.every(n=>n!==null)?pnls.reduce((a,b)=>a+b,0):null,markets:counts.every(n=>n!==null&&n>=0&&Number.isInteger(n))?counts.reduce((a,b)=>a+b,0):null,present:true};
}
export function normalizeSocialTrades(payload,username,now=Date.now()){
 if(!Array.isArray(payload?.trades))throw Error('Social trade response changed');
 const visibility=payload.visibility_state||'unknown',seen=new Set(),trades=[];
 // Hidden means unavailable, never a verified empty portfolio or zero activity.
 if(visibility==='hidden')return {visibility,trades,complete:false,pageSize:0};
 for(const t of payload.trades){
  if(!weatherTicker(t.ticker)||!t.trade_id||seen.has(t.trade_id))continue;seen.add(t.trade_id);
  const time=Date.parse(t.create_date),count=number(t.count_fp,number(t.count));
  const yesPrice=number(t.price_dollars,number(t.price)!==null?number(t.price)/100:null);
  if(!Number.isFinite(time)||time>now+1000||count===null||count<=0||yesPrice===null||yesPrice<=0||yesPrice>=1)continue;
  const role=t.taker_nickname===username?'taker':t.maker_nickname===username?'maker':'unverified';
  const side=role==='taker'&&['yes','no'].includes(t.taker_side)?t.taker_side:null;
  const action=role==='taker'&&['buy','sell'].includes(t.taker_action)?t.taker_action:null;
  trades.push({id:t.trade_id,ticker:t.ticker,username,role,side,action,count,price:side==='yes'?yesPrice:side==='no'?Math.round((1-yesPrice)*10000)/10000:null,time:new Date(time).toISOString()});
 }
 return {visibility,trades:trades.sort((a,b)=>Date.parse(b.time)-Date.parse(a.time)),complete:!payload.cursor,pageSize:payload.trades.length};
}
export function matchTraderTrade(trade,rows,now=Date.now()){
 const reasons=[],age=now-Date.parse(trade.time);
 if(trade.role!=='taker'||trade.action!=='buy'||!['yes','no'].includes(trade.side))reasons.push('Verified taker buy required; maker intent is ambiguous');
 if(!Number.isFinite(age)||age<0||age>300000)reasons.push('Trade is outside the five-minute review window');
 const row=rows.find(r=>r.ticker===trade.ticker&&r.side===trade.side);
 if(!row)reasons.push('Exact contract and side are outside the current radar filters');
 else {
  const b=row.book;
  if(!row.audited||!row.complete||!Number.isFinite(row.received)||now-row.received<0||now-row.received>15000)reasons.push('Fresh, complete radar audit required');
  if(!b||!Number.isFinite(b.ask)||b.ask<.55||b.ask>.95||!Number.isFinite(b.spread)||b.spread<0||b.spread>.03+1e-8||b.depth<10||!Number.isFinite(b.depth))reasons.push('Current ask, spread or depth fails review filters');
  if(!Number.isFinite(Date.parse(row.close))||Date.parse(row.close)-now<1800000)reasons.push('At least 30 minutes before close required');
  if(!Number.isFinite(trade.price)||!b||b.ask-trade.price>.03+1e-8)reasons.push('Current ask is more than 3¢ above the observed trade');
 }
 return {status:reasons.length?'WATCH':'REVIEW',reasons,row,drift:row?.book&&Number.isFinite(trade.price)?row.book.ask-trade.price:null};
}
