import Link from 'next/link';
import type { Story } from '@/lib/news';

export function StoryCard({story,lead=false}:{story:Story;lead?:boolean}){
  const image = story.media?.public_url || '/webfit-news-logo.png';
  return <article className={lead?'story-card story-card-lead':'story-card'}>
    <Link href={`/${story.slug}`} className="story-image"><img src={image} alt={story.media?.alt_text || story.title}/></Link>
    <div className="eyebrow">{story.article_type.replaceAll('_',' ')}</div>
    <h2><Link href={`/${story.slug}`}>{story.title}</Link></h2>
    {lead && story.excerpt ? <p>{story.excerpt}</p> : null}
    {story.published_at ? <time dateTime={story.published_at}>{new Date(story.published_at).toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'})}</time> : null}
  </article>
}
