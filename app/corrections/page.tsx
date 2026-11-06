import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/PublicFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { absoluteUrl } from '@/lib/site';

const newsroomEmail = 'webfitnews@gmail.com';

export const metadata: Metadata = {
  title: 'Corrections and Complaints',
  description: 'Report an error in Webfit News coverage or lodge an editorial complaint with the newsroom.',
  alternates: { canonical: absoluteUrl('/corrections') },
};

export default function Corrections() {
  return (
    <>
      <SiteHeader />
      <main className="static-page">
        <span className="article-kicker">Accountability</span>
        <h1>Corrections and Complaints</h1>
        <p className="standfirst">
          If something we published is inaccurate or you believe it breaches our editorial standards, please let us know.
        </p>

        <h2>Request a correction</h2>
        <p>
          Email <a href={`mailto:${newsroomEmail}?subject=Correction%20request`}>{newsroomEmail}</a> with the link
          or headline, the publication date if known, and the specific detail you believe is wrong. If you have
          supporting information, include it. We review requests and explain significant corrections in the published item.
        </p>

        <h2>Make a formal editorial complaint</h2>
        <p>
          Email <a href={`mailto:${newsroomEmail}?subject=Formal%20editorial%20complaint`}>{newsroomEmail}</a> with
          “Formal editorial complaint” in the subject line. Include the item, what concerns you and, if you can, the relevant{' '}
          <a href="https://www.mediacouncil.org.nz/principles/">Media Council principle</a>. For a complaint about
          a specific article, send it within one calendar month of first publication under the Council’s procedure.
        </p>

        <h2>Escalate to the New Zealand Media Council</h2>
        <p>
          If you are dissatisfied with our substantive response, or receive no response within ten working days of our
          receiving your complaint, the Council’s procedure gives you 20 working days to lodge a complaint with it.
          Check the <a href="https://www.mediacouncil.org.nz/complaints-procedure/">Council’s complaints procedure</a>{' '}
          for the full time limits, exceptions and submission details.
        </p>
        <p>Read the <Link href="/editorial-policy">Webfit News Editorial Policy</Link>.</p>
      </main>
      <PublicFooter />
    </>
  );
}
