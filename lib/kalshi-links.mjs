import {eventDate} from './weather-quality.mjs';

// Canonical series paths observed on Kalshi's public market pages.
const SLUGS={
 KXHIGHNY:'highest-temperature-in-nyc',
 KXHIGHCHI:'highest-temperature-in-chicago',
 KXHIGHMIA:'highest-temperature-in-miami',
 KXHIGHLAX:'highest-temperature-in-los-angeles',
 KXHIGHAUS:'highest-temperature-in-austin',
 KXHIGHDEN:'highest-temperature-in-denver',
 KXHIGHPHIL:'highest-temperature-in-philadelphia'
};

export function kalshiSlipUrl(row){
 const ticker=row?.ticker;
 if(typeof ticker!=='string'||!['yes','no'].includes(row?.side))return null;
 const match=ticker.match(/^(KXHIGH[A-Z]+)-(\d{2}[A-Z]{3}\d{2})-(?:B|T)-?\d+(?:\.\d+)?$/);
 if(!match)return null;
 const series=match[1],event=series+'-'+match[2],slug=SLUGS[series];
 if(!slug||!eventDate(event))return null;
 // Do not silently open another date or series when persisted metadata disagrees.
 if(row.series&&row.series!==series||row.event&&row.event!==event||row.event_ticker&&row.event_ticker!==event)return null;
 const url=new URL('https://kalshi.com/markets/'+series.toLowerCase()+'/'+slug+'/'+event.toLowerCase());
 // Native order-panel parameters, observed on Kalshi and verified after reload.
 url.searchParams.set('op_market_ticker',ticker);
 url.searchParams.set('op_order_side',row.side);
 url.searchParams.set('op_side','BUY');
 url.searchParams.set('op_order_type','dollars');
 return url.href;
}
