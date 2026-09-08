import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { BreakingStrip } from '@/components/BreakingStrip';
import { AdSlot } from '@/components/AdSlot';
import { VideoSection } from '@/components/VideoSection';
import { AnimatedMastheadLogo } from '@/components/AnimatedMastheadLogo';
import { getBreakingStories,getHomepageFeed,getLatestStories,getPublishedVideos } from '@/lib/news';
import { getPublicStoryTitle } from '@/lib/public-story-display';
import adFlow from './HomeAdFlow.module.css';
import styles from './EditorialHomepage.module.css';

export const revalidate=60;

const sectionTone=(index:number)=>[styles.cream,styles.blue,styles.yellow,styles.mint][index%4];

function EditorialSection({title,stories,index}:{title:string;stories:any[];index:number}){
  const normalizedTitle=title.trim().toLowerCase();
  const hiddenSlugs=new Set(
    normalizedTitle==='features'
      ? ['provide-guidelines-for-using-the-logo-effectively','consider-different-perspectives-and-opinions-to-ensure-the-design-is-widely-accepted']
      : normalizedTitle==='auckland'
        ? ['queenstown-airport-delivers-record-20-4-million-dividend-after-passenger-numbers-hit-2-82-million-2026']
        : []
  );
  const visible=stories.filter(story=>!hiddenSlugs.has(story.slug));
  const eyebrowLabel=normalizedTitle==='opinion & columns'?'Opinion':normalizedTitle==='features'?'Feature':undefined;
  if(!visible.length)return null;

  return <section className={`${styles.editorialBand} ${sectionTone(index)}`}>
    <div className={styles.bandInner}>
      <div className={styles.sectionTitleRow}>
        <div><span>Webfit News</span><h2>{title}</h2></div>
        <Link href="/search">Explore more →</Link>
      </div>
      <div className={styles.sectionFeature}>
        {visible[0]?<StoryCard story={visible[0]} variant="horizontal" eyebrowLabel={eyebrowLabel}/>:null}
        <div className={styles.sectionGrid}>
          {visible.slice(1,7).map((story:any)=><StoryCard key={story.id} story={story} eyebrowLabel={eyebrowLabel}/>) }
        </div>
      </div>
    </div>
  </section>;
}

export default async function Home(){
  let breaking:any[]=[];try{breaking=await getBreakingStories(4)}catch{breaking=[]}
  let videos:any[]=[];try{videos=await getPublishedVideos(8)}catch{videos=[]}
  let latestStories:any[]=[];try{latestStories=await getLatestStories(48)}catch{latestStories=[]}
  let sections:any[]=[];try{sections=await getHomepageFeed()}catch{sections=[]}

  if(!sections.some(s=>s.stories?.length)){
    sections=latestStories.length?[
      {key:'hero',title:'Top Stories',stories:latestStories.slice(0,5)},
      {key:'new-zealand',title:'New Zealand',stories:latestStories.slice(8,16)},
      {key:'more',title:'More from Webfit News',stories:latestStories.slice(16,24)}
    ]:[];
  }

  const configuredHero=sections.find(s=>s.key==='hero'&&s.stories?.length)||sections.find(s=>s.stories?.length);
  const explicitHero=latestStories.find(s=>s.is_homepage_hero);
  const hero=explicitHero
    ? {key:'hero',title:'Top Stories',stories:[explicitHero,...latestStories.filter(s=>s.id!==explicitHero.id)].slice(0,5)}
    : configuredHero;

  const heroIds=new Set((hero?.stories||[]).map((s:any)=>s.id));
  const latest=latestStories.filter(s=>!heroIds.has(s.id)).slice(0,8);
  const editorPicks=latestStories.filter(s=>s.is_editor_pick||s.is_featured).filter(s=>!heroIds.has(s.id)).slice(0,4);
  const popular=editorPicks.length>=4?editorPicks:latestStories.filter(s=>!heroIds.has(s.id)).slice(4,8);
  const configuredRest=sections.filter(s=>s!==configuredHero&&s.stories?.length&&s.key!=='latest');
  const rest=latest.length?[{key:'latest',title:'Latest',stories:latest},...configuredRest]:configuredRest;

  return <>
    <SiteHeader/>
    <BreakingStrip stories={breaking}/>

    <main className={styles.home}>
      <div className={`shell ${adFlow.desktopTopAd}`}>
        <AdSlot slotKey="HEADER_LEADERBOARD" className="ad-top"/>
      </div>

      <section className={styles.mastIntro}>
        <AnimatedMastheadLogo/>
        <div className={styles.mastMeta}>
          <span>Independent New Zealand journalism</span>
          <div><Link href="/category/new-zealand">Aotearoa</Link><Link href="/category/communities">Communities</Link><Link href="/category/politics">Politics</Link></div>
        </div>
      </section>

      {hero?.stories?.length?<section className={styles.heroWrap}>
        <div className={styles.heroLead}><StoryCard story={hero.stories[0]} variant="lead"/></div>
        <div className={styles.heroRail}>{hero.stories.slice(1,5).map((story:any)=><StoryCard key={story.id} story={story} variant="compact"/>)}</div>
      </section>:null}

      {popular.length?<section className={styles.popular}>
        <div className={styles.popularHead}><span>Right now</span><h2>Popular</h2></div>
        <div className={styles.popularGrid}>
          {popular.map((story:any,index:number)=><Link href={`/${story.slug}`} key={story.id} className={styles.popularItem}>
            <strong>{String(index+1).padStart(2,'0')}</strong>
            <span>{getPublicStoryTitle(story.title)}</span>
          </Link>)}
        </div>
      </section>:null}

      <section className={styles.subscribeBand}>
        <div><span>Stay in the loop</span><h2>Webfit News, wherever you are.</h2><p>Follow the stories shaping New Zealand and our communities.</p></div>
        <div className={styles.subscribeActions}><Link href="/login">Subscribe / Sign in</Link><Link href="/support-us">Support our journalism</Link></div>
      </section>

      <div className={`shell ${adFlow.desktopAfterHeroAd}`}><AdSlot slotKey="HOME_AFTER_HERO"/></div>

      {rest.map((section:any,index:number)=><div key={section.id||section.key}>
        <EditorialSection title={section.title} stories={section.stories} index={index}/>
        {index===0?<div className={`shell ${adFlow.mobileAdBreak}`}><AdSlot slotKey="HOME_AFTER_HERO"/></div>:null}
        {index===1?<div className={`shell ${adFlow.sectionAdBreak}`}><AdSlot slotKey="HOME_MIDDLE"/></div>:null}
        {index===2&&videos.length?<section className={styles.watchBand}><div className={styles.bandInner}><VideoSection videos={videos}/></div></section>:null}
        {index===3?<div className={`shell ${adFlow.mobileAdBreak}`}><AdSlot slotKey="HOME_SIDEBAR_1"/></div>:null}
      </div>)}

      {videos.length&&rest.length<3?<section className={styles.watchBand}><div className={styles.bandInner}><VideoSection videos={videos}/></div></section>:null}

      <section className={styles.followBand}>
        <div><span>Webfit News</span><h2>News with colour, context and community.</h2></div>
        <div className={styles.followLinks}><a href="https://www.facebook.com/webfitnews" target="_blank" rel="noopener noreferrer">Facebook</a><a href="https://www.youtube.com/@webfitnews" target="_blank" rel="noopener noreferrer">YouTube</a><Link href="/support-us">Support</Link></div>
      </section>

      {!hero&&!rest.length?<section className="prelaunch"><img src="/webfit-news-logo.png" alt="Webfit News"/><h1>Webfit News newsroom is connected.</h1><p>Editorial content is ready for homepage curation.</p></section>:null}
    </main>
    <PublicFooter/>
  </>;
}
