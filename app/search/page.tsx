import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { searchStories } from '@/lib/news';
export const revalidate=0;
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){const {q=''}=await searchParams;let stories:any[]=[];if(q)try{stories=await searchStories(q)}catch{}return <><SiteHeader/><main className="shell search-page"><div className="archive-heading"><span>Search Webfit News</span><h1>{q?`Results for “${q}”`:'Find a story'}</h1></div><form className="public-search" action="/search"><input name="q" defaultValue={q} placeholder="Search headlines and summaries" autoFocus/><button>Search</button></form>{q?<p className="result-count">{stories.length} result{stories.length===1?'':'s'}</p>:null}<div className="story-grid">{stories.map(s=><StoryCard key={s.id} story={s}/>)}</div></main><PublicFooter/></>}
