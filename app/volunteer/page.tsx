import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { agreementSections, agreementVersion, volunteerContact, volunteerPrivacyNotice } from '@/lib/volunteer-agreement';
import { VolunteerForm } from './VolunteerForm';

export const metadata: Metadata = {
  title: 'Volunteer Media Agreement and NDA',
  description: 'Read and sign the Webfit News agreement for occasional volunteer media assignments.',
  alternates: { canonical: 'https://webfitnews.com/volunteer' },
  robots: { index: false, follow: true },
};

export default function VolunteerPage() {
  return (
    <>
      <SiteHeader />
      <main className="static-page">
        <span className="article-kicker">Webfit News Volunteers</span>
        <h1>Volunteer Media Agreement and NDA</h1>
        <p className="standfirst">
          Read and sign this agreement before taking part in an occasional Webfit News media assignment.
          Your Volunteer Media Coordinator will send written authorisation separately for each approved event.
        </p>
        <p><small>Agreement version {agreementVersion}</small></p>
        {agreementSections.map(({ title, paragraphs }) => (
          <section key={title}>
            <h2>{title}</h2>
            {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <p>Read our <Link href="/editorial-policy">editorial policy</Link> before covering an event.</p>
        <h2>How we use your details</h2>
        <p id="volunteer-privacy">
          {volunteerPrivacyNotice}{' '}
          <a href={`mailto:${volunteerContact}`}>{volunteerContact}</a>{' · '}
          <Link href="/privacy-policy">Privacy policy</Link>
        </p>
        <VolunteerForm />
      </main>
      <PublicFooter />
    </>
  );
}
