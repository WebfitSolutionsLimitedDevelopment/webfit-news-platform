import type { Metadata } from 'next';
import styles from './sports.module.css';
import { XMLParser } from 'fast-xml-parser';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { CricketScores } from '@/components/CricketScores';
import { SportsMedia } from '@/components/SportsMedia';
import { getPublishedVideos } from '@/lib/news';
import { getSectionPage } from '@/lib/section';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Sports | Live scores, fixtures and news | Webfit News',
  description: 'Follow cricket, football, rugby, basketball, motorsport and more. Live cricket scores, international fixtures, results and original Webfit News sports reporting.',
  alternates: { canonical: absoluteUrl('/sports') },
};

const SPORTS = [
  ['Soccer','Football'],['Rugby','Rugby'],['Basketball','Basketball'],
  ['Motorsport','Motorsport'],['Tennis','Tennis'],['Ice Hockey','Ice Hockey'],
  ['Baseball','Baseball'],['American Football','American Football'],
  ['Volleyball','Volleyball'],['Golf','Golf'],['Boxing','Boxing'],
  ['Fighting','MMA'],['Cycling','Cycling'],['Handball','Handball'],
  ['Netball','Netball'],['Darts','Darts'],['Snooker','Snooker'],
  ['Athletics','Athletics'],['Badminton','Badminton'],['Table Tennis','Table Tennis'],
] as const;
type Event = { idEvent?: string; strEvent?: string; strLeague?: string; dateEvent?: string; strTime?: string; intHomeScore?: string | null; intAwayScore?: string | null; strHomeTeam?: string; strAwayTeam?: string; strSport?: string; strStatus?: string };
type League = { idLeague?: string; strLeague?: string; strSport?: string };
const API = 'https://www.thesportsdb.com/api/v1/json/123';
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(6500) });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch { return null; }
}
function eventLabel(e: Event) {
  return e.strEvent || [e.strHomeTeam,e.strAwayTeam].filter(Boolean).join(' vs ') || 'Match';
}
function eventScore(e: Event) {
  return e.intHomeScore != null && e.intAwayScore != null ? `${e.intHomeScore} – ${e.intAwayScore}` : null;
}
type NewsItem = { title: string; url: string; source: string; date: string };
async function getSportHeadlines(sport: string): Promise<NewsItem[]> {
  try {
    const query = sport === 'All sports' ? 'sports news' : sport + ' sports news';
    const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(query + ' when:7d') + '&hl=en-NZ&gl=NZ&ceid=NZ:en';
    const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(6500) });
    if (!response.ok) return [];
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(await response.text());
    const raw = parsed?.rss?.channel?.item;
    const items: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return items.slice(0, 18).flatMap(item => {
      const title = String(item.title || '').trim();
      const link = String(item.link || '');
      if (!title || !link.startsWith('https://news.google.com/')) return [];
      return [{ title, url: link, source: typeof item.source === 'string' ? item.source : String(item.source?.['#text'] || 'News'), date: String(item.pubDate || '') }];
    });
  } catch { return []; }
}
export default async function SportsPage({searchParams}:{searchParams:Promise<{sport?:string}>}) {
  const { sport } = await searchParams;
  const selected = SPORTS.find(s=>s[1].toLowerCase() === (sport||'').toLowerCase());
  const [section, published, leaguesResponse, headlines] = await Promise.all([
    getSectionPage('sports').catch(()=>null),
    getPublishedVideos(40).catch(()=>[]),
    fetchJson<{leagues:League[] | null}>(`${API}/all_leagues.php`),
    getSportHeadlines(selected?.[1] || (sport==='cricket'?'Cricket':'All sports')),
  ]);
  const availableLeagues = (leaguesResponse?.leagues || []).filter(l => selected ? l.strSport === selected[0] : true);
  const leagues = availableLeagues.slice(0,selected ? 8 : 12);
  const eventResults = await Promise.all(leagues.map(async league => {
    if (!league.idLeague) return [];
    const data = await fetchJson<{events:Event[] | null}>(`${API}/eventspastleague.php?id=${encodeURIComponent(league.idLeague!)}`);
    return (data?.events || []).slice(0,3).map(e=>({...e,strLeague:e.strLeague||league.strLeague}));
  }));
  const events = eventResults.flat().sort((a,b)=>(b.dateEvent||'').localeCompare(a.dateEvent||'')).slice(0,18);
  const cricketUpdates = !selected && sport!=='cricket' ? await getSportHeadlines('Cricket') : sport==='cricket' ? headlines : [];
  const recent = Date.now()-90*86400000;
  const terms = /\b(cricket|blackcaps|white ferns|t20|odi|rugby|football|netball|tennis|ipl|fifa|icc|basketball|motorsport|formula 1|sport|santner|kohli|rohit)\b/i;
  const videos = published.filter(v=>v.youtube_id&&terms.test(v.display_title)&&Date.parse(v.published_at||'')>=recent).slice(0,9).map(v=>({id:v.id,title:v.display_title,youtubeId:v.youtube_id!,date:v.published_at!}));
  const photos = (section?.stories||[]).filter(s=>s.media?.public_url).slice(0,9).map(s=>({id:s.id,title:s.title,image:s.media!.public_url!,alt:s.media!.alt_text||s.title,slug:s.slug,date:s.published_at}));
  const feature = headlines[0];
  const secondary = headlines.slice(1,11);
  const cricketStories = cricketUpdates.slice(0,6);
  const results = events.filter(e => e.intHomeScore != null && e.intAwayScore != null).slice(0,6);
  return <>
    <SiteHeader cricketScores={false}/>
    <main className={`shell ${styles.page}`}>
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Sports</span></nav>
      <header className={styles.masthead}>
        <span className={styles.eyebrow}>WEBFIT NEWS / SPORTS DESK</span>
        <h1>{selected ? selected[1] : 'The world of sport.'}</h1>
        <p>{selected ? `The latest ${selected[1].toLowerCase()} headlines, results and stories from around the world.` : 'The stories, scores and moments that matter. From New Zealand to the world.'}</p>
      </header>
      <nav className={styles.tabs} aria-label="Choose a sport">
        <Link className={`${styles.tab} ${!selected&&!sport?styles.active:''}`} href="/sports">Top stories</Link>
        <Link className={`${styles.tab} ${sport==='cricket'?styles.active:''}`} href="/sports?sport=cricket">Cricket</Link>
        {SPORTS.map(([_,label])=><Link className={`${styles.tab} ${selected?.[1]===label?styles.active:''}`} key={label} href={`/sports?sport=${encodeURIComponent(label)}`}>{label}</Link>)}
      </nav>
      <div className={styles.layout}>
        <div>
          <section id="news" className={styles.section} aria-label="Sports headlines">
            <div className={styles.heading}><h2>{selected ? `${selected[1]} headlines` : sport==='cricket'?'Cricket headlines':'Top stories'}</h2><span className={styles.pill}>Latest coverage</span></div>
            {feature ? <a className={styles.feature} href={feature.url} target="_blank" rel="noopener noreferrer">
              <span className={styles.source}>{feature.source} · Lead story</span>
              <h3>{feature.title}</h3>
              <p>Read the full report ↗</p>
            </a> : <div className={styles.empty}>Fresh sports coverage is on its way. Explore our reporting below.</div>}
            <div className={styles.storyGrid}>{secondary.map((item,i)=><a className={styles.story} href={item.url} key={item.url+i} target="_blank" rel="noopener noreferrer">
              <span className={styles.source}>{item.source}{item.date?` · ${new Date(item.date).toLocaleDateString('en-NZ',{day:'numeric',month:'short'})}`:''}</span>
              <h3>{item.title}</h3>
            </a>)}</div>
          </section>
          {(!selected || sport==='cricket') && <section className={`${styles.section} ${styles.cricket}`} id="cricket">
            <div className={styles.heading}><h2>Cricket match centre</h2><span className={styles.pill}>Scoreboard</span></div>
            <CricketScores/>
            <div className={styles.heading} style={{marginTop:28}}><h2>From the cricket desk</h2></div>
            <div className={styles.cricketNews}>{cricketStories.map((item,i)=><a className={styles.story} key={item.url+i} href={item.url} target="_blank" rel="noopener noreferrer"><span className={styles.source}>{item.source}</span><h3>{item.title}</h3></a>)}</div>
          </section>}
          {!selected && <section className={styles.media}><div className={styles.heading}><h2>Sports video & photography</h2></div><SportsMedia videos={videos} photos={photos}/></section>}
        </div>
        <aside className={styles.sidebar}>
          <section className={styles.section} id="results">
            <div className={styles.heading}><h2>Match centre</h2></div>
            <div className={styles.scorebox}>{results.length?results.map((e,i)=><article className={styles.match} key={e.idEvent||i}>
              <div className={styles.source}>{e.strLeague||e.strSport||'Sport'}</div>
              <h3>{eventLabel(e)}</h3>
              <strong>{eventScore(e)}</strong>
              <div className={styles.muted}>{e.dateEvent||''} · Final score</div>
            </article>):<div className={styles.empty}>No match updates right now. Catch up with the latest stories.</div>}</div>
          </section>
          <section className={styles.section}>
            <div className={styles.heading}><h2>Webfit News coverage</h2></div>
            <p className={styles.muted}>Original reporting, interviews and analysis from our sports desk.</p>
            {(section?.stories||[]).slice(0,5).map(story=><Link className={styles.story} href={`/article/${story.slug}`} key={story.id}><h3>{story.title}</h3></Link>)}
            <Link className={styles.footerlink} href="/category/sports">Explore our sports reporting →</Link>
          </section>
        </aside>
      </div>
    </main>
    <PublicFooter/>
  </>;
}
