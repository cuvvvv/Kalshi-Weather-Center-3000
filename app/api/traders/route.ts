import {createTraderReader,loadTraderBoard,loadTraderActivity} from '../../../lib/trader-fetch.mjs';
import {validUsername} from '../../../lib/trader-core.mjs';
export async function GET(req:Request){
 const p=new URL(req.url).searchParams,username=p.get('username');
 if(username!==null&&!validUsername(username))return Response.json({error:'Use a Kalshi username (letters, numbers, dot, dash or underscore; max 64).'}, {status:400});
 try{
  const read=createTraderReader();
  const data=username?await loadTraderActivity(username,read):await loadTraderBoard(read);
  return Response.json(data,{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Trader provider unavailable or response changed. No trader signal can be verified.'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
