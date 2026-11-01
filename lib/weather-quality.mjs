export const STATIONS={
 CLINYC:{station:'KNYC',city:'New York',timezone:'America/New_York'},
 CLIMDW:{station:'KMDW',city:'Chicago · Midway',timezone:'America/Chicago'},
 CLIMIA:{station:'KMIA',city:'Miami',timezone:'America/New_York'},
 CLILAX:{station:'KLAX',city:'Los Angeles',timezone:'America/Los_Angeles'},
 CLIAUS:{station:'KAUS',city:'Austin',timezone:'America/Chicago'},
 CLIDEN:{station:'KDEN',city:'Denver',timezone:'America/Denver'},
 CLIPHL:{station:'KPHL',city:'Philadelphia',timezone:'America/New_York'}
};
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function localDate(time,timezone){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time));}
export function eventDate(ticker){const m=String(ticker||'').match(/-(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})(?:-|$)/);if(!m)return null;const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];const s='20'+m[1]+'-'+String(months.indexOf(m[2])+1).padStart(2,'0')+'-'+m[3];return validDate(s)?s:null;}
export function fahrenheit(value,unit='wmoUnit:degC'){
 if(value===null||value===undefined||typeof value!=='number'||!Number.isFinite(value))return null;
 const f=['wmoUnit:degC','C'].includes(unit)?value*9/5+32:['wmoUnit:degF','F'].includes(unit)?value:null;
 return f!==null&&f>=-130&&f<=140?Math.round(f*10)/10:null;
}
export function freshness(time,now=Date.now(),maxMinutes=75){const t=typeof time==='number'?time:Date.parse(time);if(!Number.isFinite(t))return {status:'missing',ageMinutes:null};const age=(now-t)/60000;return {status:age< -5?'future':age>maxMinutes?'stale':'fresh',ageMinutes:Math.round(age)};}
export function observationComparison(a,b){if(!a||!b||a.temperatureF===null||b.temperatureF===null)return {status:'unavailable',differenceF:null};const dt=Math.abs(Date.parse(a.time)-Date.parse(b.time))/60000;if(!Number.isFinite(dt)||dt>15)return {status:'different_times',differenceF:null};const differenceF=Math.round(Math.abs(a.temperatureF-b.temperatureF)*10)/10;return {status:differenceF>3?'disagreement':'aligned',differenceF,timeDifferenceMinutes:Math.round(dt)};}
export function normalizeNwsObservation(raw,station,now){const p=raw?.properties||{},value=fahrenheit(p.temperature?.value,p.temperature?.unitCode),match=p.station?.split('/').pop()===station;const fresh=freshness(p.timestamp,now);return {provider:'NWS',station,time:p.timestamp||null,temperatureF:value,description:p.textDescription||'',qc:p.temperature?.qualityControl||'unknown',raw:p.rawMessage||null,stationMatch:match,freshness:fresh.status,ageMinutes:fresh.ageMinutes,usable:match&&value!==null&&fresh.status==='fresh'&&p.temperature?.qualityControl==='V'};}
export function normalizeMetar(raw,station,now){const rows=Array.isArray(raw)?raw:[],m=rows.filter(x=>x.icaoId===station).sort((a,b)=>b.obsTime-a.obsTime)[0];if(!m)return {provider:'NOAA AWC',station,time:null,temperatureF:null,usable:false,freshness:'missing',ageMinutes:null,raw:null,qc:null};const time=Number.isFinite(m.obsTime)?new Date(m.obsTime*1000).toISOString():null,fresh=freshness(time,now);return {provider:'NOAA AWC',station,time,receivedAt:m.receiptTime||null,temperatureF:fahrenheit(m.temp),raw:m.rawOb||null,reportType:m.metarType||null,qc:m.qcField??null,maintenanceFlag:/\$\s*$/.test(m.rawOb||''),freshness:fresh.status,ageMinutes:fresh.ageMinutes,usable:fahrenheit(m.temp)!==null&&fresh.status==='fresh'};}
export function qualityReport(nws,metar,forecast,eventDate,now){const issues=[];
 if(!nws?.usable)issues.push('NWS observation missing, stale, station-mismatched or not QC-verified');
 if(!metar?.usable)issues.push('Aviation observation missing or stale');
 const comparison=observationComparison(nws,metar);if(comparison.status==='disagreement')issues.push('Comparable station reports differ by more than 3°F');
 if(!forecast?.updated||freshness(forecast.updated,now,360).status!=='fresh')issues.push('Daily forecast issue time missing or older than six hours');
 if(!forecast?.periods?.some(p=>p.isDaytime&&p.start.slice(0,10)===eventDate&&typeof p.temperature==='number'&&Number.isFinite(p.temperature)))issues.push('No daytime forecast period matches the selected date');
 if(nws?.raw?.includes('$')||metar?.maintenanceFlag)issues.push('Raw station report contains a maintenance indicator');
 return {status:issues.length?'REVIEW':'FRESH_CONTEXT',issues,comparison,independence:'NWS and AWC may relay the same station report; agreement is not independent model confirmation.',settlementStatus:'NOT_CONNECTED',probabilityStatus:'UNCALIBRATED'};
}
