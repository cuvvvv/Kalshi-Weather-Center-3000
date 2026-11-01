import {collectWeather} from '../../../lib/weather-fetch.mjs';
import {STATIONS,validDate,localDate} from '../../../lib/weather-quality.mjs';
import {archiveWeather,weatherHistory} from '../../../db/weather-store';
import {withOptionalCache} from '../../../lib/optional-cache.mjs';
export async function GET(req:Request){
 const p=new URL(req.url).searchParams,product=p.get('product')||'',station=(STATIONS as any)[product];
 if(!station)return Response.json({error:'Unknown station product; no nearby-station substitution performed'},{status:400});
 const date=p.get('date')||localDate(Date.now(),station.timezone);
 if(!validDate(date))return Response.json({error:'A valid YYYY-MM-DD date is required'},{status:400});
 if(p.get('history')==='1'){try{return Response.json(await weatherHistory(product,date),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Archive lookup failed',enabled:false},{status:503})}}
 if(Math.abs(Date.parse(date+'T12:00:00Z')-Date.now())>8*86400000)return Response.json({error:'Live forecast requests must be within eight days; use history=1 for archived records'},{status:400});
 const key=new Request('https://weather-edge-cache.invalid/weather/'+product+'/'+date);
 let cache:Cache|undefined;try{cache=(caches as any).default;}catch{}
 try{return await withOptionalCache(cache,key,async()=>{const data:any=await collectWeather(product,date);let archive:any;
 try{archive=await archiveWeather(data)}catch{archive={enabled:false,saved:false,error:'Archive write failed; this response is live only'}}
 return Response.json({...data,archive},{headers:{'Cache-Control':'public, max-age=120'}});
 });
 }catch(e:any){return Response.json({station:station.station,error:e.message,quality:{status:'UNAVAILABLE',probabilityStatus:'UNCALIBRATED',settlementStatus:'NOT_CONNECTED'}},{status:502,headers:{'Cache-Control':'no-store'}})}
}
