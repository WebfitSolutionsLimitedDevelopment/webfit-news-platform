import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { TOPICS, getTopicStories } from '@/lib/topics';

export const revalidate = 600;

const description = 'Webfit News topic pages: every story on the NZ election, immigration and visas, the cost of living and festivals, gathered in one place.';

export const metadata: Metadata = {
  title: { absolute: `Topics | ${SITE_NAME}` },
  description,
  alternates: { canonical: absoluteUrl('/topics') },
  openGraph: { type: 'website', url: absoluteUrl('/topics'), siteName: SITE_NAME, title: `Topics | ${SITE_NAME}`, description, locale: 'en_NZ' },
};

export default async function TopicsIndex() {
  const counts = await Promise.all(TOPICS.map(async t => (await getTopicStories(t)).length));
  return <>
    <SiteHeader/>
    <main className="shell category-page topic-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Topics</span></nav>
      <div className="archive-heading"><span>In focus</span><h1>Topics</h1><p>{description}</p></div>
      <div className="topic-cards">{TOPICS.map((t, i) => <Link key={t.slug} href={`/topics/${t.slug}`} className="topic-card"><span>{t.kicker}</span><strong>{t.name}</strong><p>{t.articleNote}</p><small>{counts[i]} stories</small></Link>)}</div>
    </main>
    <PublicFooter/>
  </>;
}
