'use client';
import { useEffect, useState } from 'react';

type Media = { id:string; public_url:string|null; alt_text:string|null; filename:string|null; width:number|null; height:number|null };

export default function MediaPicker({value,onChange}:{value:string;onChange:(id:string)=>void}){
  const [open,setOpen]=useState(false); const [items,setItems]=useState<Media[]>([]); const [loading,setLoading]=useState(false); const [q,setQ]=useState('');
  async function load(term=''){setLoading(true);try{const r=await fetch(`/api/admin/media?q=${encodeURIComponent(term)}&limit=60`);const d=await r.json();setItems(d.media||[])}finally{setLoading(false)}}
  useEffect(()=>{if(open)load('')},[open]);
  const selected=items.find(x=>x.id===value);
  return <div className="media-picker">
    {selected?.public_url?<div className="media-selected"><img src={selected.public_url} alt={selected.alt_text||selected.filename||''}/><button type="button" onClick={()=>onChange('')}>Remove</button></div>:null}
    <button className="button-link" type="button" onClick={()=>setOpen(true)}>{value?'Change featured image':'Select from Media Library'}</button>
    {open?<div className="media-modal" role="dialog" aria-modal="true"><div className="media-modal-card"><div className="media-modal-head"><div><strong>Media Library</strong><small>Choose an image already stored in Webfit News</small></div><button type="button" onClick={()=>setOpen(false)}>Close</button></div><div className="media-search"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')load(q)}} placeholder="Search filename, alt text or caption"/><button type="button" onClick={()=>load(q)}>Search</button></div>{loading?<p className="admin-note">Loading media...</p>:<div className="media-picker-grid">{items.map(m=><button type="button" key={m.id} className={`media-pick ${value===m.id?'selected':''}`} onClick={()=>{onChange(m.id);setOpen(false)}}>{m.public_url?<img src={m.public_url} alt={m.alt_text||m.filename||''}/>:<span>No preview</span>}<small>{m.filename||'Untitled media'}</small></button>)}</div>}</div></div>:null}
  </div>
}
