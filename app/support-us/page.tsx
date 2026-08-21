import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { SupportForm } from '@/components/support/SupportForm';

export const metadata={title:'Support Webfit News',description:'Support independent New Zealand journalism and community reporting from Webfit News.'};

export default function SupportPage(){
  return <><SiteHeader/><main className="support-page"><div className="shell support-shell">
    <section className="support-intro"><span>Reader support</span><h1>Keep independent journalism open to everyone.</h1><p>Webfit News is building a New Zealand newsroom focused on useful reporting, community voices and stories with context. Reader contributions help fund reporting, photography, technology, event coverage and the day-to-day work required to publish responsibly.</p><p><strong>No paywall is attached to your contribution.</strong> Support is voluntary and helps us keep our journalism accessible.</p></section>
    <section className="support-panel"><div><span className="support-panel-kicker">Make a contribution</span><h2>Choose an amount</h2><p>Every contribution helps strengthen independent reporting. Choose a preset amount or enter your own.</p></div><SupportForm/></section>
    <section className="support-values"><article><strong>Independent</strong><p>Editorial decisions remain driven by public interest, not by individual contributors.</p></article><article><strong>Open</strong><p>Supporting Webfit News does not create a paywall for other readers.</p></article><article><strong>Accountable</strong><p>Our editorial standards, corrections process and Media Council commitments remain visible to readers.</p></article></section>
  </div></main><PublicFooter/></>;
}
