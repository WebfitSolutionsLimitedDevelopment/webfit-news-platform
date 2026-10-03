'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function slugify(value:string){return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

function AuthorEditor({author,currentUserId,onDone}:{author:any;currentUserId:string;onDone:()=>void}){
  const [title,setTitle]=useState(author.title||'');
  const [bio,setBio]=useState(author.bio||'');
  const [avatar,setAvatar]=useState(author.avatar_url||'');
  const [isMe,setIsMe]=useState(Boolean(currentUserId&&author.profile_id===currentUserId));
  const [busy,setBusy]=useState(false);
  const [note,setNote]=useState('');
  async function save(){
    setBusy(true);setNote('');
    try{
      const r=await fetch(`/api/admin/authors/${author.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({title:title.trim()||null,bio:bio.trim()||null,avatar_url:avatar.trim()||null,link_to_me:isMe})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(typeof d.error==='string'?d.error:'Check the photo address is a full https:// link.');
      onDone();
    }catch(e:any){setNote(e.message)}finally{setBusy(false)}
  }
  return <div className="admin-form-grid" style={{marginTop:10}}>
    <label><span>Role / title</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Senior Reporter"/></label>
    <label><span>Photo address (https://…)</span><input value={avatar} onChange={e=>setAvatar(e.target.value)} placeholder="Upload in Media, then paste its link"/></label>
    <label style={{gridColumn:'1/-1'}}><span>Bio: 2 to 4 sentences on experience and beats</span><textarea rows={4} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Covers Auckland politics and community affairs. Previously…"/></label>
    <label style={{gridColumn:'1/-1',display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={isMe} onChange={e=>setIsMe(e.target.checked)} style={{width:'auto'}}/><span>This is me: use as my byline on new stories</span></label>
    <div className="admin-actions"><button className="admin-primary" disabled={busy} onClick={save}>{busy?'Saving...':'Save profile'}</button>{note&&<span className="admin-note">{note}</span>}</div>
  </div>;
}

export default function AuthorManager({authors,currentUserId=''}:{authors:any[];currentUserId?:string}) {
  const router=useRouter();
  const [name,setName]=useState('');
  const [slug,setSlug]=useState('');
  const [email,setEmail]=useState('');
  const [title,setTitle]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [linkMe,setLinkMe]=useState(false);
  const [editing,setEditing]=useState<string|null>(null);

  async function create(){
    setBusy(true); setMessage('');
    try{
      const r=await fetch('/api/admin/authors',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,slug:slug||slugify(name),email:email||null,title:title||null,is_active:true,link_to_me:linkMe})});
      const d=await r.json(); if(!r.ok) throw new Error(typeof d.error==='string'?d.error:'Could not create author');
      setName('');setSlug('');setEmail('');setTitle('');setLinkMe(false);setMessage('Author created. Use Edit to add a bio and photo.');router.refresh();
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
      <label style={{display:'flex',gap:8,alignItems:'center',margin:'10px 0'}}><input type="checkbox" checked={linkMe} onChange={e=>setLinkMe(e.target.checked)}/><span>This is me: use as my byline on new stories</span></label>
      <div className="admin-actions"><button className="admin-primary" disabled={busy||name.trim().length<2} onClick={create}>{busy?'Saving...':'Add author'}</button></div>
      {message&&<p className="admin-note">{message}</p>}
    </section>
    <section className="admin-card admin-table-wrap">
      <table><thead><tr><th>Author</th><th>Title</th><th>Email</th><th>Status</th><th>Origin</th></tr></thead>
      <tbody>{authors.map(a=><tr key={a.id}><td><strong>{a.name}</strong>{currentUserId&&a.profile_id===currentUserId?<em style={{marginLeft:6,fontSize:11,color:'#17613b'}}>(you)</em>:null}<br/><code>{a.slug}</code><br/><small style={{color:a.bio?'#17613b':'#a32323'}}>{a.bio?'Bio added':'No bio yet'}</small> · <button type="button" className="admin-text-link" style={{border:0,background:'none',padding:0,cursor:'pointer'}} onClick={()=>setEditing(editing===a.id?null:a.id)}>{editing===a.id?'Close':'Edit'}</button>{editing===a.id?<AuthorEditor author={a} currentUserId={currentUserId} onDone={()=>{setEditing(null);router.refresh()}}/>:null}</td><td>{a.title||'/'}</td><td>{a.email||'/'}</td><td><label className="toggle"><input type="checkbox" checked={a.is_active} onChange={e=>toggle(a.id,e.target.checked)}/><span>{a.is_active?'Active':'Inactive'}</span></label></td><td>{a.wp_author_id?'Historical archive':'Native Webfit News'}</td></tr>)}</tbody></table>
      {!authors.length&&<p className="admin-empty">No author profiles yet.</p>}
    </section>
  </>;
}
