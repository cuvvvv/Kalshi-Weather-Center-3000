import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherRecord,normalizeSocialTrades,matchTraderTrade,weatherTicker,validUsername} from '../lib/trader-core.mjs';
import {loadTraderBoard,loadTraderActivity} from '../lib/trader-fetch.mjs';
const now=Date.parse('2026-11-01T02:00:00Z'),ticker='KXHIGHNY-26NOV01-B60.5';
const trade={trade_id:'fill-1',ticker,create_date:new Date(now-30000).toISOString(),count_fp:'10.50',price_dollars:'.2000',taker_side:'no',taker_action:'buy',taker_nickname:'leader',maker_nickname:'other'};
const row={ticker,side:'no',audited:true,complete:true,received:now-1000,close:new Date(now+3600000).toISOString(),book:{ask:.82,spread:.02,depth:10}};
test('only supported daily-high series and bounded usernames pass',()=>{
 assert.equal(weatherTicker(ticker),true);assert.equal(weatherTicker('KXHIGHNYFAKE-26NOV01'),false);assert.equal(weatherTicker('KXLOWNY-26NOV01'),false);
 assert.equal(validUsername('name.1_test-a'),true);assert.equal(validUsername('../secret'),false);assert.equal(validUsername('a'.repeat(65)),false);
});
test('category absence and unknown values never become zero P&L or win rate',()=>{
 assert.deepEqual(weatherRecord({categories:[{category:'Sports',pnl:90000,markets:100}]}),{pnl:null,markets:null,present:false});
 assert.deepEqual(weatherRecord({categories:[{category:'Climate And Weather',pnl:null,markets:'30'}]}),{pnl:null,markets:30,present:true});
 assert.throws(()=>weatherRecord({data:[]}));
});
test('explicit taker NO buys use complement price, deduplicate and exclude other markets',()=>{
 const d=normalizeSocialTrades({trades:[trade,trade,{...trade,trade_id:'sports',ticker:'KXNBA-26NOV01'},{...trade,trade_id:'future',create_date:new Date(now+5000).toISOString()}],cursor:'next'},'leader',now);
 assert.equal(d.trades.length,1);assert.equal(d.trades[0].price,.8);assert.equal(d.trades[0].count,10.5);assert.equal(d.trades[0].action,'buy');assert.equal(d.complete,false);
});
test('maker prints, missing identities and missing taker action cannot become buy signals',()=>{
 const maker=normalizeSocialTrades({trades:[trade]},'other',now).trades[0];assert.equal(maker.role,'maker');assert.equal(maker.side,null);assert.equal(maker.action,null);
 const unknown=normalizeSocialTrades({trades:[{...trade,taker_nickname:'',maker_nickname:''}]},'leader',now).trades[0];assert.equal(unknown.role,'unverified');
 const action=normalizeSocialTrades({trades:[{...trade,taker_action:undefined}]},'leader',now).trades[0];assert.equal(action.action,null);
 for(const t of [maker,unknown,action])assert.equal(matchTraderTrade(t,[row],now).status,'WATCH');
});
test('hidden activity is unavailable, even if inconsistent payload includes rows',()=>{
 const d=normalizeSocialTrades({visibility_state:'hidden',trades:[trade]},'leader',now);assert.equal(d.visibility,'hidden');assert.equal(d.trades.length,0);assert.equal(d.complete,false);
});
test('review needs same ticker and side, current book and acceptable delayed entry price',()=>{
 const t=normalizeSocialTrades({trades:[trade]},'leader',now).trades[0];
 assert.equal(matchTraderTrade(t,[row],now).status,'REVIEW');
 for(const r of [{...row,side:'yes'},{...row,complete:false},{...row,received:now-15001},{...row,book:{...row.book,ask:.84}},{...row,book:{...row.book,depth:9}},{...row,close:new Date(now+1799000).toISOString()}])assert.equal(matchTraderTrade(t,[r],now).status,'WATCH');
 assert.equal(matchTraderTrade({...t,action:'sell'},[row],now).status,'WATCH');
 assert.equal(matchTraderTrade({...t,time:new Date(now-300001).toISOString()},[row],now).status,'WATCH');
});
test('discovery screens weather history rather than overall profit, and exposes failed coverage',async()=>{
 const read=async url=>url.includes('leaderboard')?{period:'30d',traders:[
  {kalshi_username:'sports',sports_share:1,pnl:999999},
  {kalshi_username:'weather',sports_share:0,pnl:300,last_synced_at:new Date(now-1000).toISOString()},
  {kalshi_username:'thin',sports_share:null,pnl:400,last_synced_at:new Date(now-1000).toISOString()},
  {kalshi_username:'broken',sports_share:.5,pnl:500}
 ]}:url.includes('/broken/')?Promise.reject(Error('Offline')):{categories:[{category:'Climate And Weather',pnl:100,markets:url.includes('/thin/')?1:40}]};
 const d=await loadTraderBoard(read,now);assert.equal(d.coverage.selected,3);assert.equal(d.coverage.checked,2);assert.equal(d.errors.length,1);
 assert.equal(d.traders.find(t=>t.username==='weather').researchCandidate,true);assert.equal(d.traders.find(t=>t.username==='thin').researchCandidate,false);assert.equal(d.traders.some(t=>t.username==='sports'),false);
});
test('nickname changes need an explicit first-party profile resolution, never name guessing',async()=>{
 const read=async url=>url.includes('/trades?')?{visibility_state:'visible',trades:[{...trade,taker_nickname:'renamed'}]}:{social_profile:{nickname:'renamed'}};
 const d=await loadTraderActivity('old-name',read,now);assert.equal(d.canonical,'renamed');assert.equal(d.identity,'profile-resolved');assert.equal(d.trades[0].role,'taker');
 const noProof=await loadTraderActivity('old-name',async url=>url.includes('/trades?')?{trades:[trade]}:{social_profile:{nickname:'different'}},now);assert.equal(noProof.trades[0].role,'unverified');
});
