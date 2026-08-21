import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata={
  title:'Advertise with Webfit News',
  description:'Advertising and media opportunities with Webfit News across New Zealand news, business, community and digital coverage.'
};

export default function AdvertiseMediaKitPage(){
  return <>
    <SiteHeader/>
    <main className="static-page">
      <span className="article-kicker">Advertising</span>
      <h1>Advertise with Webfit News</h1>
      <p className="standfirst">Reach Webfit News readers through clearly identified advertising placements across our digital news coverage.</p>

      <h2>Advertising opportunities</h2>
      <p>Webfit News can accommodate display advertising across selected homepage, section and article positions. Placement availability can vary by campaign, device and editorial layout.</p>

      <h2>Audience and coverage</h2>
      <p>Our reporting covers New Zealand news, Auckland, politics, business, immigration, communities, India, world news, entertainment, sport and opinion. Campaigns can be discussed around relevant sections and reader contexts where appropriate.</p>

      <h2>Available formats</h2>
      <p>Options may include homepage placements, in-section placements, article placements and other digital campaign formats supported by the Webfit News platform. Final specifications, timing and availability are confirmed before a campaign is accepted.</p>

      <h2>Editorial independence</h2>
      <p>Advertising does not influence Webfit News editorial decisions. Paid placements are kept separate from newsroom reporting and are identified as advertising or sponsored material where applicable.</p>

      <h2>Request advertising information</h2>
      <p>For rates, placement options, campaign timing or a media kit, please <Link href="/contact">contact Webfit News</Link> with your organisation name, campaign objective, preferred dates and any available creative specifications.</p>

      <p><Link href="/contact">Contact Webfit News</Link> · <Link href="/about">About Webfit News</Link></p>
    </main>
    <PublicFooter/>
  </>;
}
