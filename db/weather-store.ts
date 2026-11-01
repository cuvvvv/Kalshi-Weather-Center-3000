import {env} from 'cloudflare:workers';
import {and,eq,desc,count,min} from 'drizzle-orm';
import {getDb} from './index';
import {weatherSnapshots} from './schema';
export async function archiveWeather(data:any){
 if(!env.DB)return {enabled:false,saved:false,error:'Archive database unavailable'};
 const fingerprint=JSON.stringify([data.product,data.eventDate,data.forecast,data.hourly,data.observation.time,data.observation.temperatureF,data.observation.raw,data.metar.time,data.metar.temperatureF,data.metar.raw,data.errors]);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint));const id=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
 const capturedAt=Date.parse(data.fetchedAt);
 await getDb().insert(weatherSnapshots).values({id,product:data.product,station:data.station,eventDate:data.eventDate,capturedAt,forecastIssuedAt:data.forecast.updated,observedAt:data.preferredObservation?.time||null,quality:data.quality.status,payload:JSON.stringify(data)}).onConflictDoNothing();
 await env.DB.prepare('DELETE FROM weather_snapshots WHERE id IN (SELECT id FROM weather_snapshots WHERE captured_at < ? LIMIT 50)').bind(Date.now()-90*86400000).run();
 const [summary]=await getDb().select({count:count(),firstCapture:min(weatherSnapshots.capturedAt)}).from(weatherSnapshots).where(and(eq(weatherSnapshots.product,data.product),eq(weatherSnapshots.eventDate,data.eventDate)));
 return {enabled:true,saved:true,id,count:summary.count,firstCapture:summary.firstCapture,retentionDays:90,collectionMode:'on demand; no unattended collector configured'};
}
export async function weatherHistory(product:string,eventDate:string){
 if(!env.DB)return {enabled:false,snapshots:[],error:'Archive database unavailable'};
 const rows=await getDb().select().from(weatherSnapshots).where(and(eq(weatherSnapshots.product,product),eq(weatherSnapshots.eventDate,eventDate))).orderBy(desc(weatherSnapshots.capturedAt)).limit(48);
 return {enabled:true,product,eventDate,limit:48,snapshots:rows.map(r=>({id:r.id,capturedAt:new Date(r.capturedAt).toISOString(),quality:r.quality,data:JSON.parse(r.payload)}))};
}
