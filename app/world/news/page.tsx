import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { StoryCard } from '@/components/StoryCard';
import WorldNewsRefresh from './WorldNewsRefresh';
import styles from './news.module.css';

export const revalidate = 60;

export const metadata = {
  title: 'World News Today | Latest International News & Global Headlines | Webfit News',
  description: 'Read the latest world news, international headlines and major global developments from Webfit News. The page refreshes automatically every minute for newly published stories.',
  alternates: { canonical: '/world/news' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'World News Today | Latest Global Headlines | Webfit News',
    description: 'Latest international news and major world developments, automatically refreshed from the Webfit News newsroom.',
    url: '/world/news',
    siteName: 'Webfit News',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World News Today | Webfit News',
    description: 'Latest international headlines and major global developments, refreshed automatically.',
  },
};

function formatDate(value?: string | null) {
  if (!value) return 'No publication time available';
  return new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Pacific/Auckland',
  }).format(new Date(value));
}

export default async function WorldNewsPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: category } = await supabase
    .from('categories')
    .select('id,name,description')
    .eq('slug', 'world')
    .eq('is_active', true)
    .maybeSingle();

  let stories: any[] = [];
  let loadError = false;

  if (category?.id) {
    const { data: links, error } = await supabase
      .from('article_categories')
      .select('article:article_id(id,title,slug,excerpt,published_at,updated_at,featured_media_id,article_type,status,media:featured_media_id(public_url,alt_text))')
      .eq('category_id', category.id)
      .limit(100);

    loadError = Boolean(error);
    stories = (links || [])
      .map((item: any) => item.article)
      .filter((article: any) => article?.status === 'published' && article?.published_at && article.published_at <= now)
      .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 40);
  }

  const newest = stories[0];
  const lastStoryTime = newest?.published_at || null;
  const itemList = stories.slice(0, 20).map((story, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `https://webfitnews.com/${story.slug}`,
    name: story.title,
  }));

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'World News Today',
      url: 'https://webfitnews.com/world/news',
      description: 'Latest international news and major global developments from Webfit News.',
      dateModified: lastStoryTime || undefined,
      isPartOf: { '@type': 'WebSite', name: 'Webfit News', url: 'https://webfitnews.com' },
      mainEntity: { '@type': 'ItemList', itemListElement: itemList },
      publisher: { '@type': 'NewsMediaOrganization', name: 'Webfit News', url: 'https://webfitnews.com' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://webfitnews.com/' },
        { '@type': 'ListItem', position: 2, name: 'World Guides', item: 'https://webfitnews.com/world' },
        { '@type': 'ListItem', position: 3, name: 'World News', item: 'https://webfitnews.com/world/news' },
      ],
    },
  ];

  return (
    <main className={styles.main}>
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}

      <p className={styles.breadcrumb}><Link href="/">Home</Link> / <Link href="/world">World Guides</Link> / World News</p>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>World Guides · Live News</p>
        <h1>World News Today</h1>
        <p>Follow the latest international headlines and major developments across politics, business, conflict, diplomacy, climate, technology, sport and society. Newly published Webfit News stories are picked up automatically.</p>
        <div className={styles.meta}>
          <span><strong>Server refresh:</strong> every 60 seconds</span>
          <span><strong>Latest story:</strong> {formatDate(lastStoryTime)}</span>
          <span><strong>Source:</strong> Webfit News newsroom</span>
        </div>
      </header>

      <div className={styles.refreshWrap}><WorldNewsRefresh /></div>

      <section className={styles.intro} aria-label="World News coverage">
        <article><h2>Breaking global developments</h2><p>New World-category stories appear here automatically after publication, without manually rebuilding this page.</p></article>
        <article><h2>International context</h2><p>Coverage spans major events affecting countries, markets, migration, security, technology and communities worldwide.</p></article>
        <article><h2>Fresh, crawlable headlines</h2><p>The latest published stories remain normal crawlable links so readers and search engines can move directly to each full report.</p></article>
      </section>

      <section aria-labelledby="latest-world-news">
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Latest updates</p>
          <h2 id="latest-world-news">Latest World News</h2>
          <p>Stories are ordered by publication time, newest first. Keep this page open and it will automatically request fresh newsroom data every minute.</p>
        </div>

        {stories.length ? (
          <div className="story-grid">
            {stories.map((story: any) => <StoryCard key={story.id} story={story} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <strong>{loadError ? 'World News could not be loaded right now.' : 'No published World stories are available yet.'}</strong>
            <p>Use the main World section while the live feed is unavailable.</p>
            <Link href="/category/world">Open the World section</Link>
          </div>
        )}
      </section>

      <section className={styles.seoCopy}>
        <h2>Latest international news and global headlines</h2>
        <p>Webfit News World News brings together current international reporting in one continuously refreshed destination. Readers can use it for the latest world news today, international headlines, global politics, major overseas developments, technology news and events that can affect New Zealand and the wider international community.</p>
        <p>For practical information alongside the news, use the related World Guides for live weather, public holidays, currency conversion, gold prices, international travel requirements, visas, world time, major sports and AI and technology resources.</p>
      </section>

      <nav className={styles.related} aria-label="Related World Guides">
        <Link href="/world">← All World Guides</Link>
        <Link href="/category/world">World news section</Link>
        <Link href="/world/ai-technology">AI & Technology</Link>
        <Link href="/world/travel-requirements">Travel Requirements</Link>
        <Link href="/world/currency-converter">Currency Converter</Link>
        <Link href="/world/weather">World Weather</Link>
      </nav>
    </main>
  );
}
