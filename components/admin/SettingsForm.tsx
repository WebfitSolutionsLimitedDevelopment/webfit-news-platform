'use client';
import { useState } from 'react';

type Props={initial:{publication:any;seo:any;trust:any;social:any}};
export default function SettingsForm({initial}:Props){
  const [message,setMessage]=useState('');
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setMessage('Saving...');
    const fd=new FormData(e.currentTarget);
    const payload={
      publication:{site_name:fd.get('site_name'),primary_domain:fd.get('primary_domain'),tagline:fd.get('tagline'),contact_email:fd.get('contact_email')},
      seo:{default_meta_title:fd.get('default_meta_title'),default_social_description:fd.get('default_social_description'),google_analytics_id:fd.get('google_analytics_id')},
      trust:{display_media_council:fd.get('display_media_council')==='on',corrections_slug:fd.get('corrections_slug'),editorial_policy_slug:fd.get('editorial_policy_slug')},
      social:{facebook:fd.get('facebook'),facebook_profile:fd.get('facebook_profile'),instagram:fd.get('instagram'),youtube:fd.get('youtube'),linkedin:fd.get('linkedin'),x:fd.get('x'),tiktok:fd.get('tiktok')}
    };
    const res=await fetch('/api/admin/settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    setMessage(res.ok?'Settings saved. Public footer and publication defaults are updated.':(body.error||'Could not save settings.'));
  }
  const p=initial.publication||{},s=initial.seo||{},t=initial.trust||{},social=initial.social||{};
  return <form onSubmit={submit}>
    <div className="settings-savebar"><div><strong>Publication settings</strong><span>{message||'Manage identity, social channels, SEO and trust signals from one place.'}</span></div><button className="admin-primary" type="submit">Save changes</button></div>
    <div className="settings-grid settings-grid-premium">
      <section className="admin-card"><div className="admin-card-title"><span>01</span><div><h2>Publication identity</h2><p>Core brand details used across the website.</p></div></div><label>Site name<input name="site_name" defaultValue={p.site_name||'Webfit News'}/></label><label>Primary domain<input name="primary_domain" defaultValue={p.primary_domain||'https://webfitnews.co.nz'}/></label><label>Tagline<input name="tagline" defaultValue={p.tagline||'New Zealand news and community perspectives'}/></label><label>Newsroom contact email<input name="contact_email" defaultValue={p.contact_email||''} placeholder="newsroom@example.com"/></label></section>
      <section className="admin-card"><div className="admin-card-title"><span>02</span><div><h2>Social media</h2><p>These links appear in the public footer.</p></div></div><label>Facebook Page<input name="facebook" type="url" defaultValue={social.facebook||social.facebook_page||''} placeholder="https://facebook.com/..."/></label><label>Facebook Profile<input name="facebook_profile" type="url" defaultValue={social.facebook_profile||''} placeholder="https://facebook.com/..."/></label><label>Instagram<input name="instagram" type="url" defaultValue={social.instagram||''} placeholder="https://instagram.com/..."/></label><label>YouTube<input name="youtube" type="url" defaultValue={social.youtube||''} placeholder="https://youtube.com/@..."/></label><label>LinkedIn<input name="linkedin" type="url" defaultValue={social.linkedin||''} placeholder="https://linkedin.com/company/..."/></label><label>X / Twitter<input name="x" type="url" defaultValue={social.x||''} placeholder="https://x.com/..."/></label><label>TikTok<input name="tiktok" type="url" defaultValue={social.tiktok||''} placeholder="https://tiktok.com/@..."/></label></section>
      <section className="admin-card"><div className="admin-card-title"><span>03</span><div><h2>SEO defaults</h2><p>Fallback metadata for discovery and sharing.</p></div></div><label>Default meta title<input name="default_meta_title" defaultValue={s.default_meta_title||'Webfit News | New Zealand News'}/></label><label>Default social description<textarea name="default_social_description" rows={5} defaultValue={s.default_social_description||''}/></label><label>Google Analytics ID<input name="google_analytics_id" defaultValue={s.google_analytics_id||''} placeholder="G-XXXXXXXXXX"/></label></section>
      <section className="admin-card"><div className="admin-card-title"><span>04</span><div><h2>Editorial trust</h2><p>Public accountability and newsroom standards.</p></div></div><label className="check-row"><input name="display_media_council" type="checkbox" defaultChecked={t.display_media_council!==false}/> Display New Zealand Media Council membership</label><label>Corrections page slug<input name="corrections_slug" defaultValue={t.corrections_slug||'corrections'}/></label><label>Editorial policy slug<input name="editorial_policy_slug" defaultValue={t.editorial_policy_slug||'editorial-policy'}/></label></section>
    </div>
  </form>;
}
