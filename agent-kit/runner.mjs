import {GET} from './app/api/scan/route.ts';
import {recordObservations} from './lib/radar-core.mjs';
import {appendFile,readFile,writeFile,rename} from 'node:fs/promises';
import {execFile} from 'node:child_process';
const file='weather-edge-alerts.jsonl',stateFile='weather-edge-marks.json',seen=new Map();let journal=[];
try{for(const line of (await readFile(file,'utf8')).trim().split('\n')){const a=JSON.parse(line);seen.set(a.ticker+a.side+(a.stage||'CONFIRMED'),Date.parse(a.time));}}catch{}
try{journal=JSON.parse(await readFile(stateFile,'utf8'));}catch{}
const once=process.argv.includes('--once'),notify=process.argv.includes('--notify');
const config=new URLSearchParams({minPrice:'.55',maxPrice:'.90',min24:'250',maxSpread:'.03',min5:'100',ratio:'2',min1:'25',earlyRatio:'3'});
async function scan(){try{const response=await GET(new Request('http://localhost/api/scan?'+config));const d=await response.json();
 console.log(d.asOf+' | '+d.coverage.candidates+' candidates | '+d.coverage.uniqueAudits+' contract audits | '+d.successfulSeries+'/7 cities | '+d.errors.length+' feed issues');if(d.errors.length)console.error(d.errors.join('\n'));
 journal=recordObservations(journal,d.rows,Date.now());
 for(const row of d.rows.filter(r=>r.alert)){
 const key=row.ticker+row.side+row.stage;if(Date.now()-(seen.get(key)||0)<900000)continue;
 const a={...row,id:crypto.randomUUID(),time:d.asOf,marks:{},kind:row.stage+'_ACTIVITY_NOT_PROBABILITY'};await appendFile(file,JSON.stringify(a)+'\n');seen.set(key,Date.now());journal=[a,...journal].slice(0,2000);
 const message=row.city+' '+row.side.toUpperCase()+' '+(row.book.ask*100).toFixed(1)+' cents | '+row.minute+' contracts/1m | '+row.earlyRatio?.toFixed(1)+'x';console.log('\x07'+row.stage+' | '+message+' | '+row.ticker);
 if(notify&&process.platform==='darwin'){const script='display notification '+JSON.stringify(message)+' with title "Weather Edge · '+row.stage+'"';execFile('osascript',['-e',script],e=>{if(e)console.error('Desktop notification failed: '+e.message)});}
 if(notify&&process.platform==='linux')execFile('notify-send',['Weather Edge · '+row.stage,message],e=>{if(e)console.error('Desktop notification failed: '+e.message)});
 }
 await writeFile(stateFile+'.tmp',JSON.stringify(journal));await rename(stateFile+'.tmp',stateFile);
 }catch(e){console.error(new Date().toISOString()+' SCAN FAILED '+e.message);}}
console.log('Weather Edge V2 | ACTIVITY / PAPER | 1m early + 5m confirmation | no calibrated probability model');
do{const start=Date.now();await scan();if(!once)await new Promise(r=>setTimeout(r,Math.max(1000,15000-(Date.now()-start))));}while(!once);
