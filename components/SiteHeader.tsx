import Link from 'next/link';
import { getPublicSiteSettings } from '@/lib/public-settings';
import { SupportBanner } from './SupportBanner';
import { SiteMenu } from './SiteMenu';

const links=[['New Zealand','/category/new-zealand'],['Auckland','/category/auckland'],['Politics','/category/politics'],['Business','/category/business'],['Immigration','/category/immigration'],['India','/category/india'],['World','/category/world'],['Community','/category/communities'],['Entertainment','/category/entertainment'],['Sports','/category/sports'],['Opinion','/category/opinion']];

export async function SiteHeader(){
  const settings=await getPublicSiteSettings();
  const siteName=settings.identity.name||'Webfit News';
  const today=new Intl.DateTimeFormat('en-NZ',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Pacific/Auckland'}).format(new Date());
  return <>
    <SupportBanner/>
    <div className="utility-premium"><div className="shell utility-premium-inner"><span>{today}</span><div><Link href="/about">About</Link><Link href="/editorial-policy">Editorial policy</Link>{settings.footer.media_council_member!==false?<span>Member, New Zealand Media Council</span>:null}</div></div></div>
    <header className="masthead-premium"><div className="shell masthead-premium-inner">
      <SiteMenu/>
      <Link href="/" className="brand-premium"><img src="/webfit-news-logo.png" alt={siteName}/></Link>
      <div className="header-actions-premium"><Link href="/search">Search</Link><Link className="newsroom-chip" href="/admin">Newsroom</Link></div>
    </div></header>
    <div className="nav-premium-wrap"><nav className="shell nav-premium">{links.map(([name,href])=><Link key={href} href={href}>{name}</Link>)}</nav></div>
  </>;
}
