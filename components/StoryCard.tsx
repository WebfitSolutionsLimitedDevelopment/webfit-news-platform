import Link from 'next/link';
import type { Story } from '@/lib/news';

type Variant='standard'|'lead'|'compact'|'horizontal';
export function StoryCard({story,lead=false,variant}:{story:Story;lead?:boolean;variant?:Variant}){
  const resolved:Variant=variant||(lead?'lead':'standard');
  const image=story.media?.public_url||'/webfit-news-logo.png';
  return <article className={`story-card story-card-${resolved}`}>
    <Link href={`/${story.slug}`} className="story-image"><img src={image} alt={story.media?.alt_text||story.title}/></Link>
    <div className="story-copy">
      <div className="eyebrow">{story.article_type.replaceAll('_',' ')}</div>
      <h2><Link href={`/${story.slug}`}>{story.title}</Link></h2>
      {(resolved==='lead'||resolved==='horizontal')&&story.excerpt?<p>{story.excerpt}</p>:null}
      {story.published_at?<time dateTime={story.published_at}>{new Date(story.published_at).toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'})}</time>:null}
    </div>
  </article>;
}
