import type { Metadata } from 'next';
import Link from 'next/link';
import { CricketScores } from '@/components/CricketScores';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Live cricket scores | Webfit News',
  description: 'Cricket scores, recent results and upcoming matches, alongside cricket reporting from Webfit News.',
  alternates: { canonical: absoluteUrl('/live-cricket') },
};

export default function LiveCricketPage() {
  return <>
    <SiteHeader cricketScores={false} />
    <main className="shell category-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Cricket scores</span></nav>
      <div className="archive-heading">
        <span>Sport</span><h1>Live cricket scores</h1>
        <p>Follow scores, recent results and upcoming fixtures here on Webfit News.</p>
      </div>
      <CricketScores />
      <p><Link href="/category/sports">Read the latest sports coverage from Webfit News →</Link></p>
    </main>
    <PublicFooter />
  </>;
}
