import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { ArticleAudioPlayer } from '@/components/ArticleAudioPlayer';
import { EditorialSupportPrompt } from '@/components/EditorialSupportPrompt';
import { getArticleBySlug, getLatestStories, getRelatedStories, resolveInlineArticleMedia } from '@/lib/news';
import { articleHtmlToText, sanitizeArticleHtml } from '@/lib/article-html';
import { getPublicStoryTitle, getPublicStoryTypeLabel } from '@/lib/public-story-display';
import { SEO_DESCRIPTION_MAX_LENGTH, SEO_TITLE_MAX_LENGTH, truncateSeoText } from '@/lib/seo';
import discovery from '@/components/ArticleDiscovery.module.css';
import { AdSlot } from '@/components/AdSlot';
import { ElectionPollCard } from '@/components/ElectionPollPromo';
import { RSS_ALTERNATE, SITE_NAME, SITE_URL, absoluteUrl, articleCanonical, articleUrl } from '@/lib/site';
import { countTopLevelParagraphs, splitArticleHtml } from '@/lib/ads';
import { responsiveImage, responsiveBodyImages } from '@/lib/image-url';

/**
 * Stories are cached at the edge for five minutes and refreshed immediately
 * when edited in the CMS (revalidateEditorialContent), instead of being rebuilt
 * from the database on every visit.
 */
export const revalidate=300;
export async function generateStaticParams(){return [];}

/** Search titles keep the whole headline (Google trims the display itself); cutting at 60 characters dropped the keywords. */
const SEARCH_TITLE_MAX_LENGTH=160;

/** Older stories stored titles that were pre-cut with "..."; those are ignored in favour of the full headline. */
function uncut(value?:string|null):string|null{
  const v=value?.trim();
  return v&&!/(\.\.\.|…)$/.test(v)?v:null;
}

/** Only very long headlines are shortened, and then at a natural break (comma, colon, dash) rather than mid-phrase. */
function searchTitle(headline:string):string{
  if(headline.length<=SEARCH_TITLE_MAX_LENGTH)return headline;
  const head=headline.slice(0,SEARCH_TITLE_MAX_LENGTH);
  const clause=Math.max(head.lastIndexOf(', '),head.lastIndexOf(': '),head.lastIndexOf(' - '),head.lastIndexOf('; '));
  if(clause>=60)return head.slice(0,clause).trim();
  return truncateSeoText(headline,SEARCH_TITLE_MAX_LENGTH)||headline;
}

function storyDescription(article:any):string{
  const direct=article.meta_description||article.excerpt||article.subtitle;
  if(direct)return truncateSeoText(direct,SEO_DESCRIPTION_MAX_LENGTH);
  return truncateSeoText(articleHtmlToText(article.content_html||''),SEO_DESCRIPTION_MAX_LENGTH);
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const article=await getArticleBySlug(slug);
  if(!article)return{};

  const canonical=articleCanonical(article.slug,article.canonical_url);
  const publicTitle=getPublicStoryTitle(article.title);
  // Older stories stored a pre-cut SEO title ending in "..."; use the full headline instead.
  const seoTitle=searchTitle(uncut(article.seo_title)||publicTitle);
  const metaDescription=storyDescription(article);
  const socialTitle=uncut(article.social_title)||publicTitle;
  const socialDescription=article.social_description||metaDescription||undefined;
  const socialImage=article.media?.public_url||`${articleUrl(article.slug)}/social-card`;
  const indexable=article.robots_index!==false;
  const cats=(article.article_categories||[]).map((x:any)=>x.category).filter(Boolean);

  return{
    title:{absolute:seoTitle},
    description:metaDescription,
    alternates:{canonical,types:RSS_ALTERNATE},
    robots:{index:indexable,follow:article.robots_follow!==false,googleBot:{index:indexable,follow:article.robots_follow!==false,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
    authors:article.author?.name?[{name:article.author.name}]:[{name:SITE_NAME}],
    openGraph:{
      type:'article',
      url:canonical,
      siteName:SITE_NAME,
      locale:'en_NZ',
      title:socialTitle,
      description:socialDescription,
      images:[{url:socialImage,alt:article.media?.alt_text||publicTitle,...(article.media?.width&&article.media?.height?{width:article.media.width,height:article.media.height}:{})}],
      publishedTime:article.published_at||undefined,
      modifiedTime:article.updated_at||undefined,
      section:cats[0]?.name,
      authors:article.author?.name?[article.author.name]:undefined,
    },
    twitter:{card:'summary_large_image',title:socialTitle,description:socialDescription,images:[socialImage]}
  };
}

export default async function ArticlePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const article=await getArticleBySlug(slug);
  if(!article)notFound();
  if(article.slug!==slug)redirect(`/${article.slug}`);

  const displayTitle=getPublicStoryTitle(article.title);
  const displayType=getPublicStoryTypeLabel(article.article_type,article.title);
  const resolvedContent=await resolveInlineArticleMedia(article.content_html||'');
  const clean=responsiveBodyImages(sanitizeArticleHtml(resolvedContent));
  const speechText=articleHtmlToText(`${displayTitle}. ${article.subtitle||''}. ${clean}`);

  // Ad breaks: after paragraph 3 on stories with at least 5 paragraphs, and
  // after paragraph 8 on stories with at least 11, so ads never crowd a short story.
  const paragraphCount=countTopLevelParagraphs(clean);
  const breaks=[paragraphCount>=5?3:0,paragraphCount>=11?8:0].filter(Boolean);
  const bodyChunks=splitArticleHtml(clean,breaks);
  const breakSlots=['ARTICLE_INLINE_1','ARTICLE_INLINE_2'];
  const cats=(article.article_categories||[]).map((x:any)=>x.category).filter(Boolean);
  const related=await getRelatedStories(article.id,cats.map((c:any)=>c.id),4);

  let latest:any[]=[];
  try{latest=await getLatestStories(24)}catch{latest=[]}
  const relatedIds=new Set(related.map((story:any)=>story.id));
  const discoveryStories=latest.filter((story:any)=>story.id!==article.id&&!relatedIds.has(story.id));
  const popular=discoveryStories.slice(0,4);
  const keepReading=discoveryStories.slice(4,12);

  const pageUrl=articleUrl(article.slug);
  const bodyText=articleHtmlToText(clean);
  const image=article.media?.public_url?{'@type':'ImageObject',url:article.media.public_url,...(article.media.width&&article.media.height?{width:article.media.width,height:article.media.height}:{}),...(article.media.caption?{caption:article.media.caption}:{})}:undefined;
  const jsonLd={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'NewsArticle',
        '@id':`${pageUrl}#article`,
        headline:displayTitle.slice(0,110),
        description:storyDescription(article),
        datePublished:article.published_at,
        dateModified:article.updated_at||article.published_at,
        image:image?[image]:undefined,
        author:article.author?.name
          ?{'@type':'Person',name:article.author.name,...(article.author.slug?{url:absoluteUrl(`/author/${article.author.slug}`)}:{}),...(article.author.title?{jobTitle:article.author.title}:{})}
          :{'@type':'Organization',name:SITE_NAME,url:SITE_URL},
        publisher:{'@id':`${SITE_URL}/#organization`},
        mainEntityOfPage:{'@type':'WebPage','@id':pageUrl},
        url:pageUrl,
        articleSection:cats[0]?.name,
        keywords:article.focus_keyword||undefined,
        inLanguage:'en-NZ',
        isAccessibleForFree:true,
        wordCount:bodyText?bodyText.split(/\s+/).filter(Boolean).length:undefined,
      },
      {
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Home',item:absoluteUrl('/')},
          ...(cats[0]?[{'@type':'ListItem',position:2,name:cats[0].name,item:absoluteUrl(`/category/${cats[0].slug}`)}]:[]),
          {'@type':'ListItem',position:cats[0]?3:2,name:displayTitle,item:pageUrl},
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>

    <div className={`shell ${discovery.topAd}`}><AdSlot slotKey="HEADER_LEADERBOARD"/></div>

    <div className={discovery.articleLayout}>
      <main className={`${discovery.articleColumn} article-shell`}>
        <article>
          <nav className="article-breadcrumb"><Link href="/">Home</Link>{cats[0]?<><span>/</span><Link href={`/category/${cats[0].slug}`}>{cats[0].name}</Link></>:null}</nav>
          <div className="article-kicker">{displayType}</div>
          <h1>{displayTitle}</h1>
          {article.subtitle?<p className="standfirst">{article.subtitle}</p>:null}
          <div className="article-meta"><span>By {article.author?.slug?<Link href={`/author/${article.author.slug}`} rel="author">{article.author.name}</Link>:<Link href="/about">Webfit News</Link>}</span>{article.published_at?<time dateTime={article.published_at}>{new Date(article.published_at).toLocaleString('en-NZ',{dateStyle:'long',timeStyle:'short',timeZone:'Pacific/Auckland'})}</time>:null}</div>
          <ArticleAudioPlayer text={speechText}/>
          <div className="share-strip"><span>Share</span><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl(article.slug))}`} target="_blank" rel="noreferrer">Facebook</a><a href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(articleUrl(article.slug))}`}>Email</a></div>
          {article.media?.public_url?<figure className="article-hero"><img {...responsiveImage(article.media.public_url,[480,800,1200,1600],'(max-width: 880px) 100vw, 850px')} alt={article.media.alt_text||displayTitle} fetchPriority="high" decoding="async" {...(article.media.width&&article.media.height?{width:article.media.width,height:article.media.height}:{})}/>{article.media.caption||article.media.credit?<figcaption>{article.media.caption}{article.media.credit?<span> Credit: {article.media.credit}</span>:null}</figcaption>:null}</figure>:null}
          {bodyChunks.map((html,index)=><div key={index}>
            <div className="article-body" dangerouslySetInnerHTML={{__html:html}}/>
            {index<bodyChunks.length-1?<AdSlot slotKey={breakSlots[index]} variant="inline"/>:null}
          </div>)}
          <ElectionPollCard/>
          <AdSlot slotKey="ARTICLE_BOTTOM" variant="inline"/>
          {cats.length?<div className="article-categories">{cats.map((c:any)=><Link key={c.id} href={`/category/${c.slug}`}>{c.name}</Link>)}</div>:null}
        </article>
      </main>

      <div className={discovery.railColumn}>
        {popular.length?<aside className={discovery.sidebar} aria-label="Popular stories">
        <span className={discovery.sidebarLabel}>What readers are opening</span>
        <h2 className={discovery.sidebarTitle}>Popular</h2>
        <div className={discovery.popularList}>
          {popular.map((story:any,index:number)=><Link className={discovery.popularItem} key={story.id} href={`/${story.slug}`}><strong>{index+1}</strong><span>{getPublicStoryTitle(story.title)}</span></Link>)}
        </div>
      </aside>:null}
        <div className={discovery.railAd}><AdSlot slotKey="ARTICLE_RAIL" variant="rail"/></div>
      </div>
    </div>

    {related.length?<section className={`${discovery.discovery} ${discovery.moreBand}`}>
      <div className={discovery.discoveryHeader}><div><span>Related</span><h2>More on this story</h2></div></div>
      <div className={discovery.discoveryGrid}>{related.map((story:any)=><StoryCard key={story.id} story={story}/>)}</div>
    </section>:null}

    {keepReading.length?<section className={discovery.discovery}>
      <div className={discovery.discoveryHeader}><div><span>From the newsroom</span><h2>Keep reading</h2></div><Link href="/">Back to homepage</Link></div>
      <div className={discovery.discoveryGrid}>{keepReading.map((story:any)=><StoryCard key={story.id} story={story}/>)}</div>
    </section>:null}

    <EditorialSupportPrompt/>
    <PublicFooter/>
    <AdSlot slotKey="MOBILE_STICKY" variant="sticky"/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/>
  </>;
}
