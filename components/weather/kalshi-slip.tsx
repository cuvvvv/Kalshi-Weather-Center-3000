'use client';
import {useState} from 'react';
import {ArrowUpRight,Copy,Check} from 'lucide-react';
import {kalshiSlipUrl} from '../../lib/kalshi-links.mjs';

export default function KalshiSlip({row,copy=false}:{row:any,copy?:boolean}){
 const [copied,setCopied]=useState(false),[failed,setFailed]=useState(false);
 const url=kalshiSlipUrl(row);if(!url)return null;
 async function copyLink(){try{await navigator.clipboard.writeText(url!);setCopied(true);setFailed(false)}catch{setFailed(true)}}
 return <span className="kalshi-slip-actions"><a className="button kalshi-slip" href={url} target="_blank" rel="noopener noreferrer" aria-label={'Open '+row.side.toUpperCase()+' slip on Kalshi for '+row.ticker}>Open {row.side.toUpperCase()} slip <ArrowUpRight size={14}/></a>{copy&&<button className="button" onClick={copyLink}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?'Link copied':failed?'Copy unavailable':'Copy slip link'}</button>}</span>
}
