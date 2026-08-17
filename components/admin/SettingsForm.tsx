'use client';
import { useState } from 'react';

type Props={initial:{publication:any;seo:any;trust:any}};
export default function SettingsForm({initial}:Props){
  const [message,setMessage]=useState('');
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setMessage('Saving...');
    const fd=new FormData(e.currentTarget);
    const payload={
      publication:{site_name:fd.get('site_name'),primary_domain:fd.get('primary_domain'),tagline:fd.get('tagline'),contact_email:fd.get('contact_email')},
      seo:{default_meta_title:fd.get('default_meta_title'),default_social_description:fd.get('default_social_description'),google_analytics_id:fd.get('google_analytics_id')},
      trust:{display_media_council:fd.get('display_media_council')==='on',corrections_slug:fd.get('corrections_slug'),editorial_policy_slug:fd.get('editorial_policy_slug')}
    };
    const res=await fetch('/api/admin/settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    setMessage(res.ok?'Settings saved.':(body.error||'Could not save settings.'));
  }
  const p=initial.publication||{}, s=initial.seo||{}, t=initial.trust||{};
  return <form onSubmit={submit}>
    <div className="settings-savebar"><span>{message||'Changes apply to publication defaults and SEO output.'}</span><button className="admin-primary" type="submit">Save Settings</button></div>
    <div className="settings-grid">
      <section className="admin-card"><h2>Publication</h2><label>Site name<input name="site_name" defaultValue={p.site_name||'Webfit News'}/></label><label>Primary domain<input name="primary_domain" defaultValue={p.primary_domain||'https://webfitnews.co.nz'}/></label><label>Tagline<input name="tagline" defaultValue={p.tagline||'New Zealand news and community perspectives'}/></label><label>Contact email<input name="contact_email" defaultValue={p.contact_email||''} placeholder="newsroom@example.com"/></label></section>
      <section className="admin-card"><h2>SEO defaults</h2><label>Default meta title<input name="default_meta_title" defaultValue={s.default_meta_title||'Webfit News | New Zealand News'}/></label><label>Default social description<textarea name="default_social_description" rows={4} defaultValue={s.default_social_description||''}/></label><label>Google Analytics ID<input name="google_analytics_id" defaultValue={s.google_analytics_id||''} placeholder="G-XXXXXXXXXX"/></label></section>
      <section className="admin-card"><h2>Editorial trust</h2><label className="check-row"><input name="display_media_council" type="checkbox" defaultChecked={t.display_media_council!==false}/> Display New Zealand Media Council membership</label><label>Corrections page slug<input name="corrections_slug" defaultValue={t.corrections_slug||'corrections'}/></label><label>Editorial policy slug<input name="editorial_policy_slug" defaultValue={t.editorial_policy_slug||'editorial-policy'}/></label></section>
    </div>
  </form>;
}
