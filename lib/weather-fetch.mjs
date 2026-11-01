import {STATIONS,localDate,normalizeNwsObservation,normalizeMetar,fahrenheit,qualityReport,validDate} from './weather-quality.mjs';
const UA='KalshiWeatherCenter/0.3 (public station evidence; weather-edge-radar.cuvvvvv.chatgpt.site)';
const memory=new Map(),pending=new Map();
async function json(url,fetcher){const r=await fetcher(url,{headers:{Accept:'application/geo+json, application/json','User-Agent':UA},signal:AbortSignal.timeout(12000)});if(r.status===204)return [];if(!r.ok)throw Error('Provider HTTP '+r.status);return r.json();}
export async function collectWeather(product,date,options={}){
 const registry=STATIONS[product];if(!registry)throw Error('Unknown station product');const now=options.now??Date.now(),fetcher=options.fetcher??fetch;
 const selectedDate=date||localDate(now,registry.timezone);if(!validDate(selectedDate))throw Error('Invalid event date');const key=product+':'+selectedDate;
 if(!options.fetcher){const c=memory.get(key);if(c&&now-c.time<120000)return c.data;if(pending.has(key))return pending.get(key);}
 const collect=async()=>{
 const errors=[];const safe=async(url,label)=>{try{return await json(url,fetcher)}catch(e){errors.push(label+': '+e.message);return null}};
 const stationUrl='https://api.weather.gov/stations/'+registry.station;
 const [meta,rawNws,rawMetar]=await Promise.all([safe(stationUrl,'Station metadata'),safe(stationUrl+'/observations/latest','NWS observations'),safe('https://aviationweather.gov/api/data/metar?ids='+registry.station+'&format=json&hours=2','Aviation observations')]);
 const coords=meta?.geometry?.coordinates;const identityMatch=meta?.properties?.stationIdentifier===registry.station;
 let points=null,daily=null,hourly=null;
 if(identityMatch&&Array.isArray(coords)&&coords.every(Number.isFinite))points=await safe('https://api.weather.gov/points/'+coords[1].toFixed(4)+','+coords[0].toFixed(4),'NWS grid mapping');
 const endpoints=points?.properties||{};const allowed=url=>typeof url==='string'&&url.startsWith('https://api.weather.gov/');
 [daily,hourly]=await Promise.all([allowed(endpoints.forecast)?safe(endpoints.forecast,'Daily forecast'):null,allowed(endpoints.forecastHourly)?safe(endpoints.forecastHourly,'Hourly forecast'):null]);
 const observation=normalizeNwsObservation(rawNws,registry.station,now),metar=normalizeMetar(rawMetar,registry.station,now);
 const periods=(daily?.properties?.periods||[]).slice(0,14).map(p=>({name:p.name,start:p.startTime,end:p.endTime,isDaytime:p.isDaytime,temperature:fahrenheit(p.temperature,p.temperatureUnit),unit:'F',description:p.shortForecast}));
 const forecast={updated:daily?.properties?.updateTime||daily?.properties?.updated||null,periods,url:endpoints.forecast||null};
 const hours=(hourly?.properties?.periods||[]).filter(p=>p.startTime?.slice(0,10)===selectedDate).map(p=>({start:p.startTime,end:p.endTime,temperatureF:fahrenheit(p.temperature,p.temperatureUnit),description:p.shortForecast,windSpeed:p.windSpeed,windDirection:p.windDirection,precipitationProbability:p.probabilityOfPrecipitation?.value??null}));
 const matchedHigh=periods.find(p=>p.isDaytime&&p.start.slice(0,10)===selectedDate)?.temperature??null;
 const quality=qualityReport(observation,metar,forecast,selectedDate,now);if(!identityMatch)quality.issues.unshift('Station metadata identity could not be verified');if(errors.length)quality.issues.push(...errors);if(quality.issues.length)quality.status='REVIEW';
 const usableObs=[observation,metar].filter(o=>o.usable).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));
 const data={version:3,product,station:registry.station,city:registry.city,name:meta?.properties?.name||registry.city,timezone:registry.timezone,eventDate:selectedDate,mappingVerified:identityMatch,coordinates:identityMatch?coords:null,observation,metar,preferredObservation:usableObs[0]||null,forecast,hourly:{updated:hourly?.properties?.updateTime||null,url:endpoints.forecastHourly||null,periods:hours},matchedForecastHighF:matchedHigh,quality,errors,fetchedAt:new Date(now).toISOString(),sources:[{name:'NWS station observation',url:stationUrl+'/observations/latest',role:'supplemental observation'},{name:'NOAA Aviation Weather Center',url:'https://aviationweather.gov/api/data/metar?ids='+registry.station+'&format=json&hours=2',role:'supplemental station report'},{name:'NWS station-grid daily forecast',url:endpoints.forecast||'https://www.weather.gov',role:'deterministic forecast'},{name:'The Weather Company · Kalshi',url:'https://weather.com/kalshi',role:'market-named source; not connected programmatically'}],notes:['NWS and aviation reports can reflect the same physical sensor.','A daily daytime forecast is not a guaranteed full-day maximum. Hourly periods may cover only the remaining part of the selected date.','The exact market rules define settlement source and time window. No settlement record or calibrated probability is generated.']};
 if(!options.fetcher){if(memory.size>64)memory.delete(memory.keys().next().value);memory.set(key,{time:now,data});}return data;
 };
 if(options.fetcher)return collect();const promise=collect();pending.set(key,promise);try{return await promise}finally{pending.delete(key)}
}
