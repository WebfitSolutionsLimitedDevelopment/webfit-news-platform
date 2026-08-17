import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { BreakingStrip } from '@/components/BreakingStrip';
import { getBreakingStories, getHomepageFeed, getLatestStories } from '@/lib/news';

export const revalidate = 60;
function StandardSection({title,stories}:{title:string;stories:any[]}){if(!stories.length)return null;return <section className="news-section"><div className="section-heading"><h2>{title}</h2></div><div className="story-grid">{stories.map(s=><StoryCard key={s.id} story={s}/>)}</div></section>}
export default async function Home(){
  let breaking:any[]=[];try{breaking=await getBreakingStories(4)}catch{breaking=[]}
  let sections:any[]=[];try{sections=await getHomepageFeed()}catch{sections=[]}
  if(!sections.some(s=>s.stories?.length)){let stories:any[]=[];try{stories=await getLatestStories(24)}catch{stories=[]}sections=stories.length?[{key:'hero',title:'Top Stories',stories:stories.slice(0,5)},{key:'latest',title:'Latest News',stories:stories.slice(5,13)},{key:'more',title:'More from Webfit News',stories:stories.slice(13,21)}]:[]}
  const hero=sections.find(s=>s.key==='hero'&&s.stories?.length);const rest=sections.filter(s=>s!==hero&&s.stories?.length);
  return <><SiteHeader/><BreakingStrip stories={breaking}/><main className="shell homepage">
    <div className="home-stripe"><span>Independent newsroom</span><strong>New Zealand stories with context, community and consequence</strong></div>
    {hero?.stories?.length?<section className="hero-grid"><div className="hero-side">{hero.stories.slice(1,3).map((s:any)=><StoryCard key={s.id} story={s}/>)}</div><StoryCard story={hero.stories[0]} lead/><div className="hero-side">{hero.stories.slice(3,5).map((s:any)=><StoryCard key={s.id} story={s}/>)}</div></section>:null}
    {rest.map((s:any,i:number)=><div key={s.id||s.key}>{i===1?<div className="ad-placeholder">ADVERTISEMENT</div>:null}<StandardSection title={s.title} stories={s.stories}/></div>)}
    {!hero&&!rest.length?<section className="prelaunch"><img src="/webfit-news-logo.png" alt="Webfit News"/><h1>The new Webfit News newsroom is connected.</h1><p>The historical archive is being validated and loaded into the new database before public cutover.</p></section>:null}
  </main><PublicFooter/></>
}
