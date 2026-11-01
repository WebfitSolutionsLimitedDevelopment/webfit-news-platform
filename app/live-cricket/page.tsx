import type { Metadata } from 'next';
import Link from 'next/link';
import { CricketScores } from '@/components/CricketScores';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { absoluteUrl } from '@/lib/site';
import { getPublishedVideos } from '@/lib/news';
import { getSectionPage } from '@/lib/section';
import { SportsMedia } from '@/components/SportsMedia';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Live cricket scores | Webfit News',
  description: 'Cricket scores, recent results and upcoming matches, alongside cricket reporting from Webfit News.',
  alternates: { canonical: absoluteUrl('/live-cricket') },
};

export default async function LiveCricketPage() {
  const [published,sports]=await Promise.all([
    getPublishedVideos(40).catch(()=>[]),
    getSectionPage('sports').catch(()=>null),
  ]);
  const recent=Date.now()-90*24*60*60*1000;
  const sportsTerms=/\b(cricket|blackcaps|white ferns|t20|odi|rugby|football|netball|tennis|ipl|fifa|icc|glenn phillips|sairaj bahutule|bevon jacobs|finn allen|arshdeep|bhuvneshwar|santner|jacob duffy)\b/i;
  const videos=published.filter(v=>v.youtube_id&&sportsTerms.test(v.display_title)&&Date.parse(v.published_at||'')>=recent).slice(0,9).map(v=>({id:v.id,title:v.display_title,youtubeId:v.youtube_id!,date:v.published_at!}));
  const photos=(sports?.stories||[]).filter(s=>s.media?.public_url&&Date.parse(s.published_at)>=recent).slice(0,9).map(s=>({id:s.id,title:s.title,image:s.media.public_url,alt:s.media.alt_text||s.title,slug:s.slug,date:s.published_at}));
  return <>
    <SiteHeader cricketScores={false} />
    <main className="shell category-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Cricket scores</span></nav>
      <div className="archive-heading">
        <span>Sport</span><h1>Live cricket scores</h1>
        <p>Follow scores, recent results and upcoming fixtures here on Webfit News.</p>
      </div>
      <CricketScores />
      <SportsMedia videos={videos} photos={photos}/>
      <p><Link href="/category/sports">Read the latest sports coverage from Webfit News →</Link></p>
    </main>
    <PublicFooter />
  </>;
}
