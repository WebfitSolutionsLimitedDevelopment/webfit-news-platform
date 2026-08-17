'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Article={id:string;title:string;slug:string;published_at:string|null};
type Slot={id?:string;position:number;article?:Article|null};
type Section={id:string;key:string;title:string;section_type:string;is_enabled:boolean;sort_order:number;max_items:number;category?:{name:string;slug:string}|null;slots?:Slot[]};

export default function HomepageManager({initialSections,articles}:{initialSections:Section[];articles:Article[]}){
 const router=useRouter();
 const [sections,setSections]=useState(()=>initialSections.map(s=>({...s,slots:Array.from({length:s.max_items},(_,i)=>s.slots?.find(x=>x.position===i+1)||{position:i+1,article:null})})));
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
 function patchSection(id:string,patch:any){setSections(list=>list.map(s=>s.id===id?{...s,...patch}:s))}
 function patchSlot(sectionId:string,position:number,articleId:string){setSections(list=>list.map(s=>s.id!==sectionId?s:{...s,slots:(s.slots||[]).map(slot=>slot.position===position?{...slot,article:articles.find(a=>a.id===articleId)||null}:slot)}))}
 async function save(){setBusy(true);setMessage('');try{const payload={sections:sections.map(s=>({id:s.id,is_enabled:s.is_enabled,max_items:s.max_items,slots:s.section_type==='manual'?(s.slots||[]).map(x=>({position:x.position,article_id:x.article?.id||null})):[]}))};const r=await fetch('/api/admin/homepage',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save homepage');setMessage('Homepage saved.');router.refresh()}catch(e:any){setMessage(e.message||'Could not save homepage')}finally{setBusy(false)}}
 return <>
  <div className="homepage-savebar"><span>{message||'Changes affect the public homepage after the next revalidation.'}</span><button className="admin-primary" disabled={busy} onClick={save}>{busy?'Saving...':'Save Homepage'}</button></div>
  <div className="homepage-admin-list">{sections.map(s=><section className="admin-card homepage-section-admin" key={s.id}>
    <div><span className="drag-handle">⋮⋮</span><div><h2>{s.title}</h2><p>{s.section_type==='manual'?'Manual editorial selection':s.section_type==='category'?`Automatic from ${s.category?.name||'category'}`:'Automatic feed'} · max {s.max_items}</p></div></div>
    <label className="toggle"><input type="checkbox" checked={s.is_enabled} onChange={e=>patchSection(s.id,{is_enabled:e.target.checked})}/><span>Enabled</span></label>
    {s.section_type==='manual'&&<div className="homepage-slot-list">{(s.slots||[]).map(slot=><div key={slot.position}><b>{slot.position}</b><select value={slot.article?.id||''} onChange={e=>patchSlot(s.id,slot.position,e.target.value)}><option value="">Choose article</option>{articles.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select>{slot.article?<a target="_blank" href={`/${slot.article.slug}/`}>View</a>:<span/>}</div>)}</div>}
  </section>)}</div>
 </>
}
