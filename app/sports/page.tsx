import type { Metadata } from 'next';
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
export default async function SportsPage({searchParams}:{searchParams:Promise<{sport?:string}>}) {
  const { sport } = await searchParams;
  const selected = SPORTS.find(s=>s[1].toLowerCase() === (sport||'').toLowerCase());
  const [section, published, leaguesResponse] = await Promise.all([
    getSectionPage('sports').catch(()=>null),
    getPublishedVideos(40).catch(()=>[]),
    fetchJson<{leagues:League[] | null}>(`${API}/all_leagues.php`),
  ]);
  const availableLeagues = (leaguesResponse?.leagues || []).filter(l => selected ? l.strSport === selected[0] : true);
  const leagues = availableLeagues.slice(0,selected ? 8 : 12);
  const eventResults = await Promise.all(leagues.map(async league => {
    if (!league.idLeague) return [];
    const data = await fetchJson<{events:Event[] | null}>(`${API}/eventspastleague.php?id=${encodeURIComponent(league.idLeague!)}`);
    return (data?.events || []).slice(0,3).map(e=>({...e,strLeague:e.strLeague||league.strLeague}));
  }));
  const events = eventResults.flat().sort((a,b)=>(b.dateEvent||'').localeCompare(a.dateEvent||'')).slice(0,18);
  const recent = Date.now()-90*86400000;
  const terms = /\b(cricket|blackcaps|white ferns|t20|odi|rugby|football|netball|tennis|ipl|fifa|icc|basketball|motorsport|formula 1|sport|santner|kohli|rohit)\b/i;
  const videos = published.filter(v=>v.youtube_id&&terms.test(v.display_title)&&Date.parse(v.published_at||'')>=recent).slice(0,9).map(v=>({id:v.id,title:v.display_title,youtubeId:v.youtube_id!,date:v.published_at!}));
  const photos = (section?.stories||[]).filter(s=>s.media?.public_url).slice(0,9).map(s=>({id:s.id,title:s.title,image:s.media!.public_url!,alt:s.media!.alt_text||s.title,slug:s.slug,date:s.published_at}));
  return <>
    <SiteHeader cricketScores={false}/>
    <main className="shell category-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Sports</span></nav>
      <div className="archive-heading">
        <span>Webfit News Sports Centre</span>
        <h1>Sports from around the world</h1>
        <p>Live cricket, international results, fixtures and original sports journalism. One destination, no extra sign-in.</p>
      </div>
      <section aria-label="Browse sports" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
        <Link href="/sports" aria-current={!selected?'page':undefined} style={{padding:'9px 14px',border:'1px solid #ddd',borderRadius:24,fontWeight:!selected?700:400}}>All sports</Link>
        <Link href="/sports#cricket" style={{padding:'9px 14px',border:'1px solid #ddd',borderRadius:24}}>Cricket</Link>
        {SPORTS.map(([_,label])=><Link key={label} href={`/sports?sport=${encodeURIComponent(label)}#results`} aria-current={selected?.[1]===label?'page':undefined} style={{padding:'9px 14px',border:'1px solid #ddd',borderRadius:24,fontWeight:selected?.[1]===label?700:400}}>{label}</Link>)}
      </section>
      {(!selected) && <section id="cricket" aria-label="Live cricket" style={{marginBottom:28}}>
        <h2>Cricket score centre</h2>
        <p>Our existing cricket score feed is available here, with no separate page needed.</p>
        <CricketScores/>
      </section>}
      <section id="results" aria-label="Sports results" style={{marginBottom:32}}>
        <h2>{selected ? selected[1] : 'Worldwide'} results</h2>
        <p style={{color:'#606775'}}>Recent results from TheSportsDB's public feed. These are not live scores; data availability and update times vary by competition.</p>
        {events.length ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12}}>
          {events.map((e,i)=><article key={e.idEvent||i} style={{border:'1px solid #e2e5e8',borderRadius:12,padding:16}}>
            <div style={{fontSize:12,color:'#6b7280'}}>{e.strSport||selected?.[1]||'Sport'} · {e.strLeague||'Competition'}</div>
            <h3 style={{fontSize:17,margin:'8px 0'}}>{eventLabel(e)}</h3>
            <div style={{fontWeight:700,fontSize:20}}>{eventScore(e)||'Result pending'}</div>
            <div style={{fontSize:12,color:'#6b7280',marginTop:6}}>{e.dateEvent||'Date unavailable'}{e.strStatus?` · ${e.strStatus}`:''}</div>
          </article>)}
        </div> : <p>There are no recent results available from the free feed for this selection. Try another sport.</p>}
        <p style={{fontSize:12,marginTop:12}}>Source: TheSportsDB public API. Scores are provided for information only and may be delayed.</p>
      </section>
      {!selected && <SportsMedia videos={videos} photos={photos}/>}
      <p><Link href="/category/sports">Read the latest Webfit News sports stories →</Link></p>
    </main>
    <PublicFooter/>
  </>;
}
