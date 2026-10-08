import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { AdSlot } from '@/components/AdSlot';
import { RSS_ALTERNATE, SITE_NAME, absoluteUrl, articleUrl } from '@/lib/site';
import { getPublicStoryTitle } from '@/lib/public-story-display';
import { TOPICS, getTopic, getTopicStories, groupTopicStories, type TopicStory } from '@/lib/topics';

/** Rebuilt every 10 minutes so new stories appear on their hub quickly. */
export const revalidate = 600;
export async function generateStaticParams() { return TOPICS.map(t => ({ slug: t.slug })); }

const MIN_INDEXABLE = 5;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) return {};
  const stories = await getTopicStories(topic);
  const url = absoluteUrl(`/topics/${topic.slug}`);
  const title = `${topic.name}: latest news and analysis | ${SITE_NAME}`;
  const image = stories.find(s => s.media?.public_url)?.media?.public_url;
  return {
    title: { absolute: title },
    description: topic.description,
    alternates: { canonical: url, types: RSS_ALTERNATE },
    robots: { index: stories.length >= MIN_INDEXABLE, follow: true },
    openGraph: { type: 'website', url, siteName: SITE_NAME, title, description: topic.description, locale: 'en_NZ', images: image ? [{ url: image }] : undefined },
    twitter: { card: 'summary_large_image', title, description: topic.description },
  };
}

function HeadlineList({ stories }: { stories: TopicStory[] }) {
  if (!stories.length) return null;
  return <ul className="topic-list">{stories.map(s => <li key={s.id}><Link href={`/${s.slug}`}>{getPublicStoryTitle(s.title)}</Link>{s.published_at ? <time dateTime={s.published_at}>{new Date(s.published_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Pacific/Auckland' })}</time> : null}</li>)}</ul>;
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();
  const stories = await getTopicStories(topic);
  const url = absoluteUrl(`/topics/${topic.slug}`);
  const latest = stories.slice(0, 4);
  const { sections, rest } = groupTopicStories(topic, stories.slice(4));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: topic.name,
        description: topic.description,
        inLanguage: 'en-NZ',
        isPartOf: { '@id': `${absoluteUrl('/')}#website` },
        publisher: { '@id': `${absoluteUrl('/')}#organization` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: stories.length,
          itemListElement: stories.slice(0, 100).map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: articleUrl(s.slug), name: getPublicStoryTitle(s.title) })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Topics', item: absoluteUrl('/topics') },
          { '@type': 'ListItem', position: 3, name: topic.name, item: url },
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className="shell category-page topic-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/topics">Topics</Link><span>/</span><span>{topic.name}</span></nav>
      <div className="archive-heading"><span>{topic.kicker}</span><h1>{topic.name}</h1>{topic.intro.map((p, i) => <p key={i}>{p}</p>)}</div>
      {topic.links.length ? <nav className="topic-links" aria-label={`${topic.name} guides and links`}>{topic.links.map(l => l.external ? <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a> : <Link key={l.href} href={l.href}>{l.label}</Link>)}</nav> : null}

      {latest.length ? <section className="topic-section"><h2>Latest</h2><div className="story-grid">{latest.map(s => <StoryCard key={s.id} story={s}/>)}</div></section> : <div className="admin-empty">No stories on this topic yet.</div>}

      <AdSlot slotKey="CATEGORY_TOP"/>

      {sections.map(section => <section key={section.title} className="topic-section">
        <h2>{section.title}</h2>
        <div className="story-grid">{section.stories.slice(0, 4).map(s => <StoryCard key={s.id} story={s}/>)}</div>
        <HeadlineList stories={section.stories.slice(4)}/>
      </section>)}

      {rest.length ? <section className="topic-section"><h2>{sections.length ? 'More coverage' : 'All coverage'}</h2>
        {sections.length ? <HeadlineList stories={rest}/> : <><div className="story-grid">{rest.slice(0, 8).map(s => <StoryCard key={s.id} story={s}/>)}</div><HeadlineList stories={rest.slice(8)}/></>}
      </section> : null}

      <p className="topic-count">{stories.length} {stories.length === 1 ? 'story' : 'stories'} on this topic. <Link href="/topics">See all topics</Link></p>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}/>
  </>;
}
