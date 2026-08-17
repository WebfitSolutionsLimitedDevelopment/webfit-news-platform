import Link from 'next/link';
import { getPublicSiteSettings } from '@/lib/public-settings';

export async function PublicFooter(){
  const settings=await getPublicSiteSettings();
  const siteName=settings.identity.name||'Webfit News';
  const tagline=settings.identity.tagline||'Independent New Zealand news, community reporting, analysis and features.';
  const social=Object.entries(settings.social||{}).filter(([,url])=>Boolean(url));
  const socialLabels:Record<string,string>={facebook:'Facebook Page',facebook_profile:'Facebook Profile',instagram:'Instagram',linkedin:'LinkedIn',youtube:'YouTube',x:'X / Twitter',tiktok:'TikTok'};
  return <footer className="site-footer-premium"><div className="shell">
    <div className="footer-top"><div className="footer-brand"><img src="/webfit-news-logo.png" alt={siteName}/><p>{tagline}</p></div><div className="footer-news"><strong>News</strong><Link href="/category/new-zealand">New Zealand</Link><Link href="/category/auckland">Auckland</Link><Link href="/category/politics">Politics</Link><Link href="/category/business">Business</Link><Link href="/category/immigration">Immigration</Link></div><div className="footer-about"><strong>Webfit News</strong><Link href="/about">About</Link><Link href="/editorial-policy">Editorial Policy</Link><Link href="/corrections">Corrections</Link><Link href="/rss.xml">RSS</Link></div><div className="footer-social"><strong>Follow</strong>{social.length?social.map(([name,url])=><a key={name} href={url} target="_blank" rel="noopener noreferrer">{socialLabels[name]||name.replaceAll('_',' ')}</a>):<span>Social links can be added in Newsroom Settings.</span>}</div></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.footer.copyright_name||siteName}</span>{settings.footer.media_council_member!==false?<span>Member, New Zealand Media Council</span>:null}<a className="powered-by" href="https://webfitt.co.nz" target="_blank" rel="noopener noreferrer">Powered by Webfit Solutions Limited</a></div>
  </div></footer>;
}
