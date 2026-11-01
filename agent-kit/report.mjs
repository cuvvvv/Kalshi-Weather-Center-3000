import {readFile} from 'node:fs/promises';
let journal;try{journal=JSON.parse(await readFile('weather-edge-marks.json','utf8'));}catch{console.log('No observations yet. Run node runner.mjs first.');process.exit(0);}
console.log('OBSERVED BID CHANGES FROM INITIAL ASK · excludes fees, not net returns, not an edge test');
for(const stage of ['EARLY','CONFIRMED'])for(const horizon of ['m15','m60']){const vals=journal.filter(a=>a.stage===stage&&a.marks?.[horizon]).map(a=>a.marks[horizon].bidChange);const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;console.log(stage+' '+horizon+' | n='+vals.length+' | mean='+(avg===null?'pending':(avg*100).toFixed(2)+' cents'));}
console.log('Sample is observational, includes correlated contracts and repeated alerts; missing future audits are not filled in. Retain negative observations. Compare independent weather days and holdout performance before risking capital.');
