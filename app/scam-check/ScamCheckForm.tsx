'use client';

import {FormEvent,useState} from 'react';
import styles from './ScamCheck.module.css';

type Result={
  query:string;
  queryType:string;
  level:'warning'|'clear'|'unknown';
  headline:string;
  explanation:string;
  fma:{status:string;detail:string;url:string;matched?:string};
  nzbn:{status:string;detail:string;url:string;name?:string;nzbn?:string;entityStatus?:string};
  checkedAt:string;
};

export default function ScamCheckForm(){
  const [query,setQuery]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [result,setResult]=useState<Result|null>(null);

  async function submit(event:FormEvent){
    event.preventDefault();
    const value=query.trim();
    if(value.length<2){setError('Enter a business name, NZBN, website, email address or phone number.');return;}
    setLoading(true);setError('');setResult(null);
    try{
      const response=await fetch('/api/scam-check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:value})});
      const body=await response.json();
      if(!response.ok)throw new Error(body?.error||'The check could not be completed.');
      setResult(body);
    }catch(err){setError(err instanceof Error?err.message:'The check could not be completed.');}
    finally{setLoading(false);}
  }

  return <div className={styles.checker}>
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label} htmlFor="scam-query">What do you want to check?</label>
      <div className={styles.inputRow}>
        <input id="scam-query" className={styles.input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Business name, NZBN, website, email or phone" maxLength={180} autoComplete="off"/>
        <button className={styles.button} disabled={loading} type="submit">{loading?'Checking…':'Check now'}</button>
      </div>
      <p className={styles.hint}>We check evidence from official New Zealand sources. A clean result is not a guarantee that a person, website or business is legitimate.</p>
    </form>

    {error&&<div className={styles.error} role="alert">{error}</div>}

    {result&&<section className={styles.result} aria-live="polite">
      <div className={styles.summary} data-level={result.level}>
        <h3>{result.headline}</h3>
        <p>{result.explanation}</p>
      </div>
      <div className={styles.grid}>
        <article className={styles.card}>
          <span className={styles.status}>{result.fma.status}</span>
          <h4>FMA warnings</h4>
          <p>{result.fma.detail}</p>
          <a href={result.fma.url} target="_blank" rel="noopener noreferrer">Check the official FMA warnings database ↗</a>
        </article>
        <article className={styles.card}>
          <span className={styles.status}>{result.nzbn.status}</span>
          <h4>NZ Business Number</h4>
          {result.nzbn.name&&<p><strong>{result.nzbn.name}</strong></p>}
          {result.nzbn.nzbn&&<p>NZBN: {result.nzbn.nzbn}</p>}
          {result.nzbn.entityStatus&&<p>Status: {result.nzbn.entityStatus}</p>}
          <p>{result.nzbn.detail}</p>
          <a href={result.nzbn.url} target="_blank" rel="noopener noreferrer">Open the official NZBN Register ↗</a>
        </article>
      </div>
      <div className={styles.privacy}><strong>Privacy:</strong> Webfit News does not save the value you enter in this checker. The server uses it only to perform this request.</div>
      <small>Checked {new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(result.checkedAt))}.</small>
    </section>}
  </div>;
}
