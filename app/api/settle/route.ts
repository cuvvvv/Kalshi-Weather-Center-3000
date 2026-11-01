export async function GET(req:Request){
 const tickers=[...new Set((new URL(req.url).searchParams.get('tickers')||'').split(','))].slice(0,40);
 const results=await Promise.all(tickers.filter(t=>/^KXHIGH[A-Z]+-[A-Z0-9]+-[A-Z0-9.\-]+$/.test(t)).map(async t=>{try{const r=await fetch('https://external-api.kalshi.com/trade-api/v2/markets/'+encodeURIComponent(t),{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);const {market:m}=await r.json() as any;return {ticker:t,result:m.result,status:m.status,settlementValue:m.settlement_value_dollars};}catch{return {ticker:t,error:true};}}));
 return Response.json({results},{headers:{'Cache-Control':'no-store'}});
}
