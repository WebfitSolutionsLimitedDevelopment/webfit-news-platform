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

export const dynamic='force-dynamic';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const article=await getArticleBySlug(slug);
  if(!article)return{};

  const canonical=article.canonical_url||`https://webfitnews.com/${article.slug}/`;
  const publicTitle=getPublicStoryTitle(article.title);
  const seoTitle=truncateSeoText(article.seo_title||publicTitle,SEO_TITLE_MAX_LENGTH)||publicTitle;
  const metaDescription=truncateSeoText(article.meta_description||article.excerpt,SEO_DESCRIPTION_MAX_LENGTH);
  const socialTitle=article.social_title||publicTitle;
  const socialDescription=article.social_description||article.meta_description||article.excerpt||undefined;
  const socialImage=article.media?.public_url||`https://webfitnews.com/${article.slug}/social-card`;

  return{
    title:{absolute:seoTitle},
    description:metaDescription,
    alternates:{canonical},
    openGraph:{
      type:'article',
      url:canonical,
      siteName:'Webfit News',
      locale:'en_NZ',
      title:socialTitle,
      description:socialDescription,
      images:[{url:socialImage,alt:article.media?.alt_text||article.title}],
      publishedTime:article.published_at||undefined,
      modifiedTime:article.updated_at||undefined
    },
    twitter:{card:'summary_large_image',title:socialTitle,description:socialDescription,images:[socialImage]}
  };
}

export default async function ArticlePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const article=await getArticleBySlug(slug);
  if(!article)notFound();
  if(article.slug!==slug)redirect(`/${article.slug}/`);

  const displayTitle=getPublicStoryTitle(article.title);
  const displayType=getPublicStoryTypeLabel(article.article_type,article.title);
  const resolvedContent=await resolveInlineArticleMedia(article.content_html||'');
  const clean=sanitizeArticleHtml(resolvedContent);
  const speechText=articleHtmlToText(`${displayTitle}. ${article.subtitle||''}. ${clean}`);
  const cats=(article.article_categories||[]).map((x:any)=>x.category).filter(Boolean);
  const related=await getRelatedStories(article.id,cats.map((c:any)=>c.id),4);

  let latest:any[]=[];
  try{latest=await getLatestStories(24)}catch{latest=[]}
  const relatedIds=new Set(related.map((story:any)=>story.id));
  const discoveryStories=latest.filter((story:any)=>story.id!==article.id&&!relatedIds.has(story.id));
  const popular=discoveryStories.slice(0,4);
  const keepReading=discoveryStories.slice(4,12);

  const jsonLd={
    '@context':'https://schema.org',
    '@type':'NewsArticle',
    headline:displayTitle,
    description:article.meta_description||article.excerpt,
    datePublished:article.published_at,
    dateModified:article.updated_at,
    image:article.media?.public_url?[article.media.public_url]:undefined,
    author:{'@type':'Person',name:article.author?.name||'Webfit News'},
    publisher:{'@type':'Organization',name:'Webfit News',logo:{'@type':'ImageObject',url:'https://webfitnews.com/webfit-news-logo.png'}},
    mainEntityOfPage:`https://webfitnews.com/${article.slug}/`
  };

  return <>
    <SiteHeader/>

    <div className={discovery.articleLayout}>
      <main className={`${discovery.articleColumn} article-shell`}>
        <article>
          <nav className="article-breadcrumb"><Link href="/">Home</Link>{cats[0]?<><span>/</span><Link href={`/category/${cats[0].slug}`}>{cats[0].name}</Link></>:null}</nav>
          <div className="article-kicker">{displayType}</div>
          <h1>{displayTitle}</h1>
          {article.subtitle?<p className="standfirst">{article.subtitle}</p>:null}
          <div className="article-meta"><span>By {article.author?.name||'Webfit News'}</span>{article.published_at?<time dateTime={article.published_at}>{new Date(article.published_at).toLocaleString('en-NZ',{dateStyle:'long',timeStyle:'short',timeZone:'Pacific/Auckland'})}</time>:null}</div>
          <ArticleAudioPlayer text={speechText}/>
          <div className="share-strip"><span>Share</span><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://webfitnews.com/${article.slug}/`)}`} target="_blank" rel="noreferrer">Facebook</a><a href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`https://webfitnews.com/${article.slug}/`)}`}>Email</a></div>
          {article.media?.public_url?<figure className="article-hero"><img src={article.media.public_url} alt={article.media.alt_text||displayTitle}/>{article.media.caption||article.media.credit?<figcaption>{article.media.caption}{article.media.credit?<span> Credit: {article.media.credit}</span>:null}</figcaption>:null}</figure>:null}
          <div className="article-body" dangerouslySetInnerHTML={{__html:clean}}/>
          {cats.length?<div className="article-categories">{cats.map((c:any)=><Link key={c.id} href={`/category/${c.slug}`}>{c.name}</Link>)}</div>:null}
        </article>
      </main>

      {popular.length?<aside className={discovery.sidebar} aria-label="Popular stories">
        <span className={discovery.sidebarLabel}>What readers are opening</span>
        <h2 className={discovery.sidebarTitle}>Popular</h2>
        <div className={discovery.popularList}>
          {popular.map((story:any,index:number)=><Link className={discovery.popularItem} key={story.id} href={`/${story.slug}`}><strong>{index+1}</strong><span>{getPublicStoryTitle(story.title)}</span></Link>)}
        </div>
      </aside>:null}
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
  </>;
}
