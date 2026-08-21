'use client';

import { useState } from 'react';

const amounts=[25,50,100,250];

export function SupportForm(){
  const [amount,setAmount]=useState(50);
  const [custom,setCustom]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const selected=custom.trim()?Number(custom):amount;

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setMessage('');
    if(!Number.isFinite(selected)||selected<5){setMessage('Please choose an amount of at least NZ$5.');return;}
    setBusy(true);
    try{
      const res=await fetch('/api/support/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({amount:selected})});
      const data=await res.json();
      if(!res.ok||!data.url){setMessage(data.error||'Secure payment is not available yet.');setBusy(false);return;}
      window.location.href=data.url;
    }catch{
      setMessage('Secure payment is temporarily unavailable. Please try again later.');
      setBusy(false);
    }
  }

  return <form className="support-form" onSubmit={submit}>
    <div className="support-amount-grid">
      {amounts.map(v=><button key={v} type="button" className={!custom&&amount===v?'active':''} onClick={()=>{setAmount(v);setCustom('')}}>NZ${v}</button>)}
    </div>
    <label className="support-custom">Other amount <span>NZ$</span><input inputMode="decimal" value={custom} onChange={e=>setCustom(e.target.value.replace(/[^0-9.]/g,''))} placeholder="Enter amount"/></label>
    <p className="support-note">This is a one-off contribution. There is no automatic recurring charge.</p>
    {message?<p className="support-error">{message}</p>:null}
    <button className="support-pay" type="submit" disabled={busy}>{busy?'Opening secure payment...':'Continue to secure payment'}</button>
    <span className="support-secure">Secure checkout is processed by Stripe when payment is enabled.</span>
  </form>;
}
