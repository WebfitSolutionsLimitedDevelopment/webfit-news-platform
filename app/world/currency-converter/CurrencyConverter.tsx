'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './currency.module.css';

const currencies = [
  ['EUR','Euro'],['USD','US Dollar'],['JPY','Japanese Yen'],['CZK','Czech Koruna'],['DKK','Danish Krone'],
  ['GBP','British Pound'],['HUF','Hungarian Forint'],['PLN','Polish Zloty'],['RON','Romanian Leu'],['SEK','Swedish Krona'],
  ['CHF','Swiss Franc'],['ISK','Icelandic Krona'],['NOK','Norwegian Krone'],['TRY','Turkish Lira'],['AUD','Australian Dollar'],
  ['BRL','Brazilian Real'],['CAD','Canadian Dollar'],['CNY','Chinese Yuan'],['HKD','Hong Kong Dollar'],['IDR','Indonesian Rupiah'],
  ['ILS','Israeli New Shekel'],['INR','Indian Rupee'],['KRW','South Korean Won'],['MXN','Mexican Peso'],['MYR','Malaysian Ringgit'],
  ['NZD','New Zealand Dollar'],['PHP','Philippine Peso'],['SGD','Singapore Dollar'],['THB','Thai Baht'],['ZAR','South African Rand'],
] as const;

type RateResponse = {
  base?: string;
  quote?: string;
  rate?: number;
  date?: string | null;
  source?: string;
  error?: string;
};

function money(value:number, currency:string){
  try{return new Intl.NumberFormat('en-NZ',{style:'currency',currency,maximumFractionDigits:4}).format(value);}
  catch{return `${value.toLocaleString('en-NZ',{maximumFractionDigits:4})} ${currency}`;}
}

export default function CurrencyConverter(){
  const [amount,setAmount]=useState('100');
  const [base,setBase]=useState('NZD');
  const [quote,setQuote]=useState('INR');
  const [rate,setRate]=useState<number|null>(null);
  const [date,setDate]=useState<string|null>(null);
  const [source,setSource]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    const controller=new AbortController();
    async function load(){
      setLoading(true);setError('');
      try{
        const response=await fetch(`/api/world/currency?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`,{signal:controller.signal});
        const data=(await response.json()) as RateResponse;
        if(!response.ok||typeof data.rate!=='number')throw new Error(data.error||'Rate unavailable');
        setRate(data.rate);setDate(data.date||null);setSource(data.source||'');
      }catch(err){
        if(controller.signal.aborted)return;
        setRate(null);setError(err instanceof Error?err.message:'Rate unavailable');
      }finally{if(!controller.signal.aborted)setLoading(false);}
    }
    void load();
    return()=>controller.abort();
  },[base,quote]);

  const numericAmount=Number(amount);
  const converted=useMemo(()=>rate!==null&&Number.isFinite(numericAmount)&&numericAmount>=0?numericAmount*rate:null,[rate,numericAmount]);

  function swap(){setBase(quote);setQuote(base);}

  return <section className={styles.tool} aria-label="Currency converter">
    <div className={styles.controls}>
      <label>
        <span>Amount</span>
        <input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" type="number" min="0" step="any" />
      </label>
      <label>
        <span>From</span>
        <select value={base} onChange={e=>setBase(e.target.value)}>
          {currencies.map(([code,name])=><option key={code} value={code}>{code} - {name}</option>)}
        </select>
      </label>
      <button className={styles.swap} type="button" onClick={swap} aria-label="Swap currencies">⇄</button>
      <label>
        <span>To</span>
        <select value={quote} onChange={e=>setQuote(e.target.value)}>
          {currencies.map(([code,name])=><option key={code} value={code}>{code} - {name}</option>)}
        </select>
      </label>
    </div>

    <div className={styles.result} aria-live="polite">
      {loading?<p>Updating reference rate…</p>:error?<p className={styles.error}>{error}</p>:converted!==null&&rate!==null?<>
        <p className={styles.small}>{money(numericAmount,base)} equals approximately</p>
        <strong>{money(converted,quote)}</strong>
        <p className={styles.rate}>1 {base} = {rate.toLocaleString('en-NZ',{maximumFractionDigits:6})} {quote}</p>
        <p className={styles.meta}>Reference date: {date||'latest available'}{source?` • ${source}`:''}</p>
      </>:<p>Enter an amount to convert.</p>}
    </div>

    <div className={styles.quick} aria-label="Popular currency pairs">
      <span>Popular:</span>
      {[['NZD','INR'],['NZD','USD'],['USD','INR'],['GBP','NZD'],['AUD','NZD'],['EUR','USD']].map(([a,b])=><button key={`${a}-${b}`} type="button" onClick={()=>{setBase(a);setQuote(b)}}>{a} → {b}</button>)}
    </div>
  </section>;
}
