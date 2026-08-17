import Link from 'next/link';
import { getPublicSiteSettings } from '@/lib/public-settings';

export async function PublicFooter(){
  const settings=await getPublicSiteSettings();
  const siteName=settings.identity.name||'Webfit News';
  const tagline=settings.identity.tagline||'Independent New Zealand news, community reporting, analysis and features.';
  return <footer className="site-footer">
    <div className="shell footer-grid">
      <div><img src="/webfit-news-logo.png" alt={siteName}/><p>{tagline}</p></div>
      <div><strong>Newsroom</strong><Link href="/category/new-zealand">New Zealand</Link><Link href="/category/auckland">Auckland</Link><Link href="/category/politics">Politics</Link><Link href="/category/immigration">Immigration</Link></div>
      <div><strong>About</strong><Link href="/about">About {siteName}</Link><Link href="/editorial-policy">Editorial Policy</Link><Link href="/corrections">Corrections</Link><Link href="/rss.xml">RSS</Link></div>
      <div><strong>{siteName}</strong>{settings.footer.media_council_member!==false?<span>Member, New Zealand Media Council</span>:null}<span>© {new Date().getFullYear()} {settings.footer.copyright_name||siteName}</span></div>
    </div>
  </footer>
}
