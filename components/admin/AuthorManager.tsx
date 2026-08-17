'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function slugify(value:string){return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

export default function AuthorManager({authors}:{authors:any[]}) {
  const router=useRouter();
  const [name,setName]=useState('');
  const [slug,setSlug]=useState('');
  const [email,setEmail]=useState('');
  const [title,setTitle]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function create(){
    setBusy(true); setMessage('');
    try{
      const r=await fetch('/api/admin/authors',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,slug:slug||slugify(name),email:email||null,title:title||null,is_active:true})});
      const d=await r.json(); if(!r.ok) throw new Error(typeof d.error==='string'?d.error:'Could not create author');
      setName('');setSlug('');setEmail('');setTitle('');setMessage('Author created.');router.refresh();
    }catch(e:any){setMessage(e.message)}finally{setBusy(false)}
  }

  async function toggle(id:string,is_active:boolean){
    const r=await fetch(`/api/admin/authors/${id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({is_active})});
    if(r.ok) router.refresh();
  }

  return <>
    <section className="admin-card">
      <h2>Add author</h2>
      <div className="admin-form-grid">
        <label><span>Name</span><input value={name} onChange={e=>{setName(e.target.value);if(!slug)setSlug(slugify(e.target.value))}} placeholder="Reporter or contributor name" /></label>
        <label><span>Slug</span><input value={slug} onChange={e=>setSlug(slugify(e.target.value))} placeholder="author-name" /></label>
        <label><span>Email</span><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="optional" /></label>
        <label><span>Role / title</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Reporter, Editor, Columnist" /></label>
      </div>
      <div className="admin-actions"><button className="admin-primary" disabled={busy||name.trim().length<2} onClick={create}>{busy?'Saving...':'Add author'}</button></div>
      {message&&<p className="admin-note">{message}</p>}
    </section>
    <section className="admin-card admin-table-wrap">
      <table><thead><tr><th>Author</th><th>Title</th><th>Email</th><th>Status</th><th>Origin</th></tr></thead>
      <tbody>{authors.map(a=><tr key={a.id}><td><strong>{a.name}</strong><br/><code>{a.slug}</code></td><td>{a.title||'/'}</td><td>{a.email||'/'}</td><td><label className="toggle"><input type="checkbox" checked={a.is_active} onChange={e=>toggle(a.id,e.target.checked)}/><span>{a.is_active?'Active':'Inactive'}</span></label></td><td>{a.wp_author_id?'Historical archive':'Native Webfit News'}</td></tr>)}</tbody></table>
      {!authors.length&&<p className="admin-empty">No author profiles yet.</p>}
    </section>
  </>;
}
