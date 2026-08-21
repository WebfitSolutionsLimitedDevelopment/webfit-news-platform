import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { BreakingStrip } from '@/components/BreakingStrip';
import { AdSlot } from '@/components/AdSlot';
import { VideoSection } from '@/components/VideoSection';
import { getBreakingStories,getHomepageFeed,getLatestStories,getPublishedVideos } from '@/lib/news';
import adFlow from './HomeAdFlow.module.css';

export const revalidate=60;

function StandardSection({title,stories,index}:{title:string;stories:any[];index:number}){
  if(!stories.length)return null;
  return <section className="premium-section">
    <div className="section-heading-premium"><div><span>Webfit News</span><h2>{title}</h2></div><Link href="/search">View more</Link></div>
    <div className={index%2===0?'section-layout-feature':'section-layout-grid'}>
      {index%2===0&&stories[0]?<StoryCard story={stories[0]} variant="horizontal"/>:null}
      <div className="section-card-grid">{stories.slice(index%2===0?1:0, index%2===0?7:8).map(s=><StoryCard key={s.id} story={s}/>)}</div>
    </div>
  </section>;
}

export default async function Home(){
  let breaking:any[]=[];try{breaking=await getBreakingStories(4)}catch{breaking=[]}
  let videos:any[]=[];try{videos=await getPublishedVideos(8)}catch{videos=[]}
  let latestStories:any[]=[];try{latestStories=await getLatestStories(40)}catch{latestStories=[]}
  let sections:any[]=[];try{sections=await getHomepageFeed()}catch{sections=[]}

  if(!sections.some(s=>s.stories?.length)){
    sections=latestStories.length?[{key:'hero',title:'Top Stories',stories:latestStories.slice(0,5)},{key:'new-zealand',title:'New Zealand',stories:latestStories.slice(13,21)},{key:'more',title:'More from Webfit News',stories:latestStories.slice(21,29)}]:[];
  }

  const configuredHero=sections.find(s=>s.key==='hero'&&s.stories?.length)||sections.find(s=>s.stories?.length);
  const explicitHero=latestStories.find(s=>s.is_homepage_hero);
  const hero=explicitHero
    ? {key:'hero',title:'Top Stories',stories:[explicitHero,...latestStories.filter(s=>s.id!==explicitHero.id)].slice(0,5)}
    : configuredHero;

  const heroIds=new Set((hero?.stories||[]).map((s:any)=>s.id));
  const automaticLatest=latestStories.filter(s=>!heroIds.has(s.id)).slice(0,8);
  const configuredRest=sections.filter(s=>s!==configuredHero&&s.stories?.length&&s.key!=='latest');
  const rest=automaticLatest.length
    ? [{key:'latest',title:'Latest News',stories:automaticLatest},...configuredRest]
    : configuredRest;
  const newsroomRibbonStories=latestStories.slice(0,4);

  return <>
    <SiteHeader/>
    <BreakingStrip stories={breaking}/>

    <main className={`shell homepage-premium ${adFlow.homepage}`}>
      <div className={adFlow.desktopTopAd}>
        <AdSlot slotKey="HEADER_LEADERBOARD" className="ad-top"/>
      </div>

      <section className="edition-bar"><div><span>Independent New Zealand newsroom</span><strong>Context. Community. Consequence.</strong></div><div className="edition-links"><Link href="/category/new-zealand">New Zealand</Link><Link href="/category/auckland">Auckland</Link><Link href="/category/immigration">Immigration</Link></div></section>

      {hero?.stories?.length?<section className="lead-layout">
        <div className="lead-main"><StoryCard story={hero.stories[0]} variant="lead"/></div>
        <div className="lead-rail">{hero.stories.slice(1,5).map((s:any)=><StoryCard key={s.id} story={s} variant="compact"/>)}</div>
      </section>:null}

      {newsroomRibbonStories.length>0?<section className="latest-ribbon"><div className="latest-label"><span>Latest</span><strong>From the newsroom</strong></div>{newsroomRibbonStories.map((s:any)=><Link className="latest-item" key={s.id} href={`/${s.slug}`}><img src={s.media?.public_url||'/webfit-news-logo.png'} alt=""/><span>{s.title}</span></Link>)}</section>:null}

      <div className={adFlow.desktopAfterHeroAd}>
        <AdSlot slotKey="HOME_AFTER_HERO"/>
      </div>

      {rest.map((s:any,i:number)=><div key={s.id||s.key}>
        <StandardSection title={s.title} stories={s.stories} index={i}/>

        {i===0?<div className={adFlow.mobileAdBreak}><AdSlot slotKey="HOME_AFTER_HERO"/></div>:null}
        {i===1?<div className={adFlow.sectionAdBreak}><AdSlot slotKey="HOME_MIDDLE"/></div>:null}
        {i===3?<div className={adFlow.mobileAdBreak}><AdSlot slotKey="HOME_SIDEBAR_1"/></div>:null}
      </div>)}

      <VideoSection videos={videos}/>

      {!hero&&!rest.length?<section className="prelaunch"><img src="/webfit-news-logo.png" alt="Webfit News"/><h1>Webfit News newsroom is connected.</h1><p>Editorial content is ready for homepage curation.</p></section>:null}
    </main>

    <PublicFooter/>
  </>;
}
