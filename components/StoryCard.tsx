import Link from 'next/link';
import type { Story } from '@/lib/news';
import { getPublicStoryTitle, getPublicStoryTypeLabel } from '@/lib/public-story-display';
import { responsiveImage } from '@/lib/image-url';

/** How wide each card's photo is on screen, so phones download a small version. */
const CARD_IMAGE: Record<string, { widths: number[]; sizes: string }> = {
  lead: { widths: [480, 800, 1200], sizes: '(max-width: 850px) 100vw, 820px' },
  horizontal: { widths: [400, 640, 960], sizes: '(max-width: 580px) 100vw, (max-width: 1100px) 50vw, 420px' },
  standard: { widths: [320, 480, 640], sizes: '(max-width: 580px) 50vw, (max-width: 1100px) 33vw, 300px' },
  compact: { widths: [320, 480, 640], sizes: '(max-width: 580px) 50vw, (max-width: 1100px) 33vw, 240px' },
};

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
  const image=story.media?.public_url||'/webfit-news-logo-400.webp';
  const excerpt=cleanExcerpt(story.excerpt);
  const displayTitle=getPublicStoryTitle(story.title);
  const displayType=getPublicStoryTypeLabel(story.article_type,story.title,eyebrowLabel);
  return <article className={`story-card story-card-${resolved}`}>
    <Link href={`/${story.slug}`} className="story-image"><img {...responsiveImage(image,CARD_IMAGE[resolved].widths,CARD_IMAGE[resolved].sizes)} alt={story.media?.alt_text||displayTitle} loading={resolved==='lead'?'eager':'lazy'} decoding="async" {...(resolved==='lead'?{fetchPriority:'high' as const}:{})}/></Link>
    <div className="story-copy">
      <div className="eyebrow">{displayType}</div>
      <h2><Link href={`/${story.slug}`}>{displayTitle}</Link></h2>
      {(resolved==='lead'||resolved==='horizontal')&&excerpt?<p>{excerpt}</p>:null}
      {story.published_at?<time dateTime={story.published_at}>{new Date(story.published_at).toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'})}</time>:null}
    </div>
  </article>;
}
