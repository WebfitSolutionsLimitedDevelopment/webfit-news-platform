import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata={title:'Contact Webfit News'};

export default function ContactPage(){
  return <>
    <SiteHeader/>
    <main className="static-page">
      <span className="article-kicker">Contact</span>
      <h1>Contact Webfit News</h1>
      <p className="standfirst">Get in touch with Webfit News about editorial matters, community coverage, corrections, advertising and reader support.</p>

      <h2>Editorial and community coverage</h2>
      <p>For story tips, community events, interview opportunities and newsroom enquiries, contact Webfit News through our official channels listed in the site footer.</p>

      <h2>Corrections</h2>
      <p>If you believe something we have published requires correction or clarification, please use our <Link href="/corrections">Corrections</Link> page.</p>

      <h2>Advertising</h2>
      <p>For advertising and media opportunities, visit our <Link href="/advertise-media-kit">Advertise</Link> page.</p>

      <h2>Reader support</h2>
      <p>For information about supporting independent Webfit News journalism, visit <Link href="/support-us">Support Webfit News</Link>.</p>
    </main>
    <PublicFooter/>
  </>;
}
