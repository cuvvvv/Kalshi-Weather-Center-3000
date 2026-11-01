import test from 'node:test';
import assert from 'node:assert/strict';
import {kalshiSlipUrl} from '../lib/kalshi-links.mjs';

test('native slip URLs preserve exact event, bucket and outcome without an amount or price',()=>{
 const row={series:'KXHIGHNY',event:'KXHIGHNY-26NOV01',ticker:'KXHIGHNY-26NOV01-B60.5',side:'no'};
 const u=new URL(kalshiSlipUrl(row));
 assert.equal(u.pathname,'/markets/kxhighny/highest-temperature-in-nyc/kxhighny-26nov01');
 assert.deepEqual(Object.fromEntries(u.searchParams),{op_market_ticker:row.ticker,op_order_side:'no',op_side:'BUY',op_order_type:'dollars'});
 assert.equal(new URL(kalshiSlipUrl({...row,side:'yes'})).searchParams.get('op_order_side'),'yes');
});
test('older journal records derive their event and support all seven cities and negative strikes',()=>{
 for(const series of ['KXHIGHNY','KXHIGHCHI','KXHIGHMIA','KXHIGHLAX','KXHIGHAUS','KXHIGHDEN','KXHIGHPHIL']){
  const u=new URL(kalshiSlipUrl({ticker:series+'-26NOV01-T-5',side:'yes'}));
  assert.equal(u.hostname,'kalshi.com');assert.ok(u.pathname.endsWith('/'+series.toLowerCase()+'-26nov01'));
 }
});
test('invalid, foreign and inconsistent contract metadata cannot create a slip',()=>{
 const row={ticker:'KXHIGHNY-26NOV01-B60.5',side:'yes'};
 for(const r of [null,{...row,side:'sell'},{...row,series:'KXHIGHCHI'},{...row,event:'KXHIGHNY-26NOV02'},{...row,event_ticker:'KXHIGHNY-26NOV02'},{...row,ticker:'KXHIGHNY-26FEB30-T50'},{...row,ticker:'KXNBA-26NOV01-T50'},{...row,ticker:row.ticker+'?redirect=evil'},{...row,ticker:'https://evil.example'}])assert.equal(kalshiSlipUrl(r),null);
});
