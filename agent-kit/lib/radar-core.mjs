/** @param {unknown} v @param {any} fallback @returns {any} */
export function number(v, fallback = null) { const n = v === null || v === undefined || v === '' ? NaN : Number(v); return Number.isFinite(n) ? n : fallback; }
export function fee(p, q, coefficient = 0.07) { return Math.ceil((coefficient*q*p*(1-p)-1e-10)*100)/100; }
export function flow(trades, now) {
 let recent=0, previous=0;
 for(const t of trades){const age=(now-Date.parse(t.created_time))/1000; const n=number(t.count_fp,number(t.count,0));if(age>=0&&age<300)recent+=n;else if(age>=300&&age<600)previous+=n;}
 return {recent,previous,ratio:previous>0?recent/previous:null};
}
export function bookSide(book, side) {
 const own=side==='yes'?'yes_dollars':'no_dollars',other=side==='yes'?'no_dollars':'yes_dollars';
 const levels=(key)=>(book?.[key]||[]).map(([p,q])=>[number(p),number(q)]).filter(([p,q])=>p!==null&&p>=0&&p<=1&&q>0).sort((a,b)=>b[0]-a[0]);
 const bids=levels(own),asks=levels(other);if(!bids.length||!asks.length)return null;
 const bid=bids[0][0],ask=Math.round((1-asks[0][0])*10000)/10000;
 return {bid,ask,spread:ask-bid,depth:asks[0][1]};
}
export function qualify(row, c) {
 return row.complete && row.book && row.book.ask>=c.minPrice && row.book.ask<=c.maxPrice && row.book.spread>=0 && row.book.spread<=c.maxSpread+1e-8 && row.book.depth>=c.quantity && row.recent>=c.min5 && row.previous>0 && row.ratio>=c.ratio;
}
export function expectancy(probability, price, quantity, coefficient=0.07, slippage=0.01){
 const fees=fee(price,quantity,coefficient);return {fees,net:quantity*(probability-price-slippage)-fees,breakeven:price+slippage+fees/quantity};
}

// One minute is compared with the per-minute rate over the preceding nine minutes.
export function earlyFlow(trades, now) {
 let minute=0,baseline=0,notional=0;const ids=new Set();
 for(const t of trades){if(t.trade_id&&ids.has(t.trade_id))continue;if(t.trade_id)ids.add(t.trade_id);const age=(now-Date.parse(t.created_time))/1000,n=number(t.count_fp,number(t.count,0));if(n<=0)continue;
 if(age>=0&&age<60){minute+=n;notional+=n*number(t.yes_price_dollars,0);}else if(age>=60&&age<600)baseline+=n;}
 return {minute,baseline,earlyRatio:baseline>0?minute/(baseline/9):null,notional};
}
export function signalStage(row,c,now=Date.now()){
 const b=row.book;if(!row.complete||!b||!Number.isFinite(row.received)||now-row.received>15000||now-row.received<0)return 'WATCH';
 if(!Number.isFinite(Date.parse(row.close))||!Number.isFinite(b.ask)||!Number.isFinite(b.spread)||!Number.isFinite(b.depth))return 'WATCH';
 if(b.ask<c.minPrice||b.ask>c.maxPrice||b.spread<0||b.spread>c.maxSpread+1e-8||b.depth<c.quantity||Date.parse(row.close)-now<c.minMinutes*60000)return 'WATCH';
 if(row.recent>=c.min5&&row.previous>0&&row.ratio>=c.ratio&&b.ask>=c.confirmMin)return 'CONFIRMED';
 if(row.minute>=c.min1&&row.baseline>=c.minBaseline&&row.earlyRatio>=c.earlyRatio)return 'EARLY';
 return 'WATCH';
}
export function maxEntry(lowerProbability,quantity,coefficient=.07,slippage=.01,minEdge=.03,cap=.9){
 if(!Number.isFinite(lowerProbability)||lowerProbability<=0||lowerProbability>=1)return null;
 for(let cent=Math.floor(cap*100);cent>=1;cent--){const price=cent/100;if(expectancy(lowerProbability,price,quantity,coefficient,slippage).net/quantity>=minEdge-1e-9)return price;}return null;
}
export function entryGate(row,evidence,positions,now=Date.now()){
 const reasons=[];const price=row.book?.ask,lower=number(evidence.lower),prob=number(evidence.probability);
 if(!row.book||!row.complete||!row.audited||now-row.received>30000||now-row.received<0||!Number.isFinite(row.received))reasons.push('Fresh, complete tape and book audit required');
 if(!Number.isFinite(price)||row.book?.depth<10||row.book?.spread<0||row.book?.spread>.03+1e-8)reasons.push('Book spread or depth fails entry gate');
 if(!Number.isFinite(Date.parse(row.close))||Date.parse(row.close)-now<30*60000)reasons.push('Less than 30 minutes before close');
 if(row.feeType!=='quadratic'||!Number.isFinite(row.coefficient))reasons.push('Unsupported fee schedule');
 if(lower===null||prob===null||lower<=0||lower>=1||prob<=0||prob>=1||lower>prob)reasons.push('Valid probability estimate and conservative floor required');
 const issued=Date.parse(evidence.issued);if(!Number.isFinite(issued)||now-issued>2*3600000||issued>now+60000)reasons.push('Evidence issue time must be within the past two hours');
 try{const u=new URL(evidence.source);if(u.protocol!=='https:')throw Error();}catch{reasons.push('HTTPS evidence source required');}
 if(!evidence.reviewed||!row.rules)reasons.push('Review station, date, source and settlement window');
 const ceiling=maxEntry(lower,10,row.coefficient,.01,.03,.9);
 if(ceiling===null||price>ceiling+1e-8)reasons.push('Ask exceeds conservative entry ceiling');
 if(positions.some(p=>p.status==='open'&&(p.event||String(p.ticker).split('-').slice(0,2).join('-'))===row.event))reasons.push('An open paper position already covers this city/day event');
 return {allowed:reasons.length===0,reasons,ceiling,expectedNet:lower!==null&&Number.isFinite(price)?expectancy(lower,price,10,row.coefficient,.01).net:null};
}
export function recordObservations(journal,rows,now){
 return journal.map(a=>{const r=rows.find(r=>r.ticker===a.ticker&&r.side===a.side&&r.audited&&r.book&&now-r.received<=30000);if(!r)return a;
 const age=now-Date.parse(a.time),marks={...(a.marks||{})};
 for(const [key,ms]of [['m15',900000],['m60',3600000]]){if(!marks[key]&&age>=ms&&age<=ms+300000)marks[key]={time:new Date(now).toISOString(),bid:r.book.bid,ask:r.book.ask,bidChange:r.book.bid-a.book.ask};}
 return {...a,marks};});
}
