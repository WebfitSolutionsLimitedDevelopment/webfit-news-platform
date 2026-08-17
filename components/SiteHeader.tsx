import Link from 'next/link';
import { getPublicSiteSettings } from '@/lib/public-settings';

const links = [
  ['New Zealand','/category/new-zealand'],['Auckland','/category/auckland'],['Politics','/category/politics'],
  ['Business','/category/business'],['Immigration','/category/immigration'],['India','/category/india'],
  ['World','/category/world'],['Community','/category/communities'],['Entertainment','/category/entertainment'],
  ['Sports','/category/sports'],['Opinion','/category/opinion']
];

export async function SiteHeader(){
  const settings=await getPublicSiteSettings();
  const siteName=settings.identity.name||'Webfit News';
  const today=new Intl.DateTimeFormat('en-NZ',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Pacific/Auckland'}).format(new Date());
  return <>
    <div className="utility"><div className="shell utility-inner"><span>{today}</span>{settings.footer.media_council_member!==false?<Link href="/about">Member, New Zealand Media Council</Link>:<span>{siteName}</span>}</div></div>
    <header className="masthead"><div className="shell masthead-inner"><Link href="/" className="brand"><img src="/webfit-news-logo.png" alt={siteName}/></Link><div className="header-actions"><Link href="/search">Search</Link><Link href="/admin">Newsroom</Link></div></div></header>
    <div className="nav-wrap"><nav className="shell nav">{links.map(([name,href])=><Link key={href} href={href}>{name}</Link>)}</nav></div>
  </>
}
