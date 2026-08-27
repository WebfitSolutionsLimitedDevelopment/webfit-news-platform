import Link from 'next/link';
import type { Story } from '@/lib/news';
import { getPublicStoryTitle, getPublicStoryTypeLabel } from '@/lib/public-story-display';

type Variant='standard'|'lead'|'compact'|'horizontal';

function cleanExcerpt(value:string|null){
  if(!value)return '';
  return value
    .replace(/<[^>]*>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'\"')
    .replace(/&#0?39;|&apos;/gi,"'")
    .replace(/&hellip;|&#8230;/gi,'…')
    .replace(/\[(?:…|\s*\.\.\.\s*)\]\s*$/,'')
    .replace(/\s+/g,' ')
    .trim();
}
export function StoryCard({story,lead=false,variant,eyebrowLabel}:{story:Story;lead?:boolean;variant?:Variant;eyebrowLabel?:string}){
  const resolved:Variant=variant||(lead?'lead':'standard');
  const image=story.media?.public_url||'/webfit-news-logo.png';
  const excerpt=cleanExcerpt(story.excerpt);
  const displayTitle=getPublicStoryTitle(story.title);
  const displayType=getPublicStoryTypeLabel(story.article_type,story.title,eyebrowLabel);
  return <article className={`story-card story-card-${resolved}`}>
    <Link href={`/${story.slug}`} className="story-image"><img src={image} alt={story.media?.alt_text||displayTitle}/></Link>
    <div className="story-copy">
      <div className="eyebrow">{displayType}</div>
      <h2><Link href={`/${story.slug}`}>{displayTitle}</Link></h2>
      {(resolved==='lead'||resolved==='horizontal')&&excerpt?<p>{excerpt}</p>:null}
      {story.published_at?<time dateTime={story.published_at}>{new Date(story.published_at).toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'})}</time>:null}
    </div>
  </article>;
}
