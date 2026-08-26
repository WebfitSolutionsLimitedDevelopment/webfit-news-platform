'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ArticleWorkspace.module.css';
import { RichArticleEditor } from './RichArticleEditor';
import { compressImageForUpload, formatUploadSize } from '../../lib/client-image-compression';

type Option={id:string;name:string};
type Media={id:string;public_url:string|null;alt_text:string|null;filename:string|null;width:number|null;height:number|null};
type Revision={id:string;title:string;created_at:string};
type ConverterResult={
  source_name:string|null;release_date:string|null;warnings:string[];
  stats:{source_words:number;article_words:number};
};

const types=[['news','News'],['breaking_news','Breaking news'],['analysis','Analysis'],['opinion','Opinion'],['editorial','Editorial'],['explainer','Explainer'],['feature','Feature'],['interview','Interview'],['community','Community'],['press_release','Press release']];

function slugify(value:string){return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,180)}
function localDate(value?:string|null){if(!value)return'';const d=new Date(value);const p=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}
function currentAucklandDate(){
  const parts=new Intl.DateTimeFormat('en-NZ',{
    timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date());
  const get=(type:Intl.DateTimeFormatPartTypes)=>parts.find(part=>part.type===type)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

function formatRevisionDate(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return value;

  const parts=new Intl.DateTimeFormat('en-NZ',{
    timeZone:'Pacific/Auckland',
    year:'numeric',
    month:'2-digit',
    day:'2-digit',
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit',
    hourCycle:'h23'
  }).formatToParts(date);

  const get=(type:Intl.DateTimeFormatPartTypes)=>parts.find(part=>part.type===type)?.value||'';
  return `${get('day')}/${get('month')}/${get('year')}, ${get('hour')}:${get('minute')}:${get('second')}`;
}

function hasMeaningfulArticleContent(html:string){
  const value=(html||'').trim();
  if(!value)return false;

  // Media and structural content are meaningful even if there is little text.
  if(/<(img|iframe|video|table|figure)\b/i.test(value))return true;

  // Rich-text editors commonly leave empty paragraph/div markup behind.
  // Strip tags, non-breaking spaces and zero-width characters before deciding
  // whether a supposedly blank editor actually contains story text.
  const text=value
    .replace(/<br\s*\/?>/gi,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/[\u200B-\u200D\uFEFF]/g,'')
    .replace(/\s+/g,' ')
    .trim();

  return text.length>0;
}


function articlePlainText(html:string){
  if(!html)return'';
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,' ')
    .replace(/<br\s*\/?>/gi,' ')
    .replace(/<\/(p|div|li|h2|h3|h4|blockquote|figcaption)>/gi,'. ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;/gi,"'")
    .replace(/\s+/g,' ')
    .trim();
}

function cleanCut(value:string,max:number){
  const text=value.replace(/\s+/g,' ').trim();
  if(text.length<=max)return text;
  const slice=text.slice(0,max+1);
  const cut=slice.lastIndexOf(' ');
  return `${(cut>Math.floor(max*.7)?slice.slice(0,cut):slice.slice(0,max)).trim().replace(/[,:;.!?-]+$/,'')}...`;
}

function firstSentence(value:string){
  const text=value.replace(/\s+/g,' ').trim();
  if(!text)return'';
  const match=text.match(/^(.{20,}?[\.\?!])(?:\s|$)/);
  return match?.[1]||text;
}

function firstHeadingFromHtml(html:string){
  const match=html.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
  return match?articlePlainText(match[1]):'';
}

function smartAutoSlug(value:string){
  const stop=new Set(['a','an','the','and','or','but','for','of','to','in','on','at','by','with','from','as','is','are','was','were']);
  const words=value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]+/g,' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word,index)=>index<3||!stop.has(word))
    .slice(0,12);
  return slugify(words.join(' ')).slice(0,90);
}


type AutoFieldKey='subtitle'|'excerpt'|'seo_title'|'meta_description'|'social_title'|'social_description'|'tags';

function articleBlocks(html:string){
  if(!html)return[];
  const blockMatches=Array.from(html.matchAll(/<(?:p|li|blockquote|h2|h3|h4)[^>]*>([\s\S]*?)<\/(?:p|li|blockquote|h2|h3|h4)>/gi));
  const blocks=blockMatches
    .map(match=>articlePlainText(match[1]))
    .map(value=>value.replace(/^\s*[•*-]\s*/,'').trim())
    .filter(value=>value.length>=12);
  if(blocks.length)return blocks;
  const plain=articlePlainText(html);
  return plain?[plain]:[];
}

function articleSentences(text:string){
  const normalized=text.replace(/\s+/g,' ').trim();
  if(!normalized)return[];
  const matches=normalized.match(/[^.!?]+(?:[.!?]+|$)/g)||[];
  return matches.map(value=>value.trim()).filter(value=>value.length>=18);
}

function deriveEditorialFields(html:string,title:string){
  const blocks=articleBlocks(html);
  const plain=blocks.join(' ').replace(/\s+/g,' ').trim();
  const sentences=articleSentences(plain);
  const normalizedTitle=title.trim().toLowerCase();
  const usefulBlocks=blocks.filter(block=>block.trim().toLowerCase()!==normalizedTitle);
  const usefulSentences=sentences.filter(sentence=>sentence.trim().toLowerCase()!==normalizedTitle);

  const subtitleSource=usefulSentences[0]||usefulBlocks[0]||'';
  const excerptSource=[usefulSentences[0],usefulSentences[1]].filter(Boolean).join(' ')||usefulBlocks.slice(0,2).join(' ');
  const metaSource=[usefulSentences[0],usefulSentences[1]].filter(Boolean).join(' ')||subtitleSource;
  const socialSource=[usefulSentences[0],usefulSentences[1],usefulSentences[2]].filter(Boolean).join(' ')||excerptSource;

  return{
    subtitle:cleanCut(subtitleSource,180),
    excerpt:cleanCut(excerptSource,260),
    seo_title:cleanCut(title||firstHeadingFromHtml(html)||firstSentence(plain),90),
    meta_description:cleanCut(metaSource,180),
    social_title:cleanCut(title||firstHeadingFromHtml(html)||firstSentence(plain),110),
    social_description:cleanCut(socialSource,220),
  };
}

function deriveSeoTags(html:string,title:string){
  const plain=`${title} ${articlePlainText(html)}`.replace(/\s+/g,' ').trim();
  if(!plain)return[];

  const stop=new Set([
    'about','after','again','against','also','among','and','are','because','been','before','being','between','both','but','can','could','did','does','during','each','for','from','had','has','have','into','its','more','most','new','not','now','only','other','our','over','said','says','she','that','the','their','them','there','these','they','this','those','through','under','very','was','were','what','when','where','which','while','who','will','with','would','you','your',
    'article','news','report','reported','according','today','yesterday'
  ]);

  const score=new Map<string,number>();
  const add=(tag:string,weight:number)=>{
    const clean=tag.replace(/\s+/g,' ').replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g,'').trim();
    if(clean.length<3||clean.length>55)return;
    const key=clean.toLowerCase();
    if(stop.has(key))return;
    score.set(clean,(score.get(clean)||0)+weight);
  };

  for(const match of plain.matchAll(/\b(?:[A-Z][A-Za-z0-9'’-]+(?:\s+[A-Z][A-Za-z0-9'’-]+){0,3})\b/g)){
    add(match[0],4);
  }

  for(const raw of plain.toLowerCase().match(/[a-z][a-z0-9'-]{3,}/g)||[]){
    if(stop.has(raw))continue;
    add(raw,1);
  }

  return Array.from(score.entries())
    .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
    .map(([tag])=>tag)
    .filter((tag,index,all)=>!all.some((other,i)=>i<index&&other.toLowerCase().includes(tag.toLowerCase())))
    .slice(0,8);
}

export default function ArticleWorkspace({
  categories,authors,article=null,revisions=[],
  initialCategoryIds=[],initialPrimaryCategoryId='',
  initialTags=[],initialMedia=null
}:{
  categories:Option[];authors:Option[];article?:any;revisions?:Revision[];
  initialCategoryIds?:string[];initialPrimaryCategoryId?:string;initialTags?:string[];initialMedia?:Media|null;
}){
  const router=useRouter();
  const fileRef=useRef<HTMLInputElement>(null);
  const sourceFileRef=useRef<HTMLInputElement>(null);
  const isEdit=Boolean(article?.id);
  const autoManagedRef=useRef<Record<AutoFieldKey,boolean>>({
    subtitle:!isEdit&&!Boolean(article?.subtitle),
    excerpt:!isEdit&&!Boolean(article?.excerpt),
    seo_title:!isEdit&&!Boolean(article?.seo_title),
    meta_description:!isEdit&&!Boolean(article?.meta_description),
    social_title:!isEdit&&!Boolean(article?.social_title),
    social_description:!isEdit&&!Boolean(article?.social_description),
    tags:!isEdit&&initialTags.length===0,
  });

  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [messageKind,setMessageKind]=useState<'info'|'success'|'error'>('info');
  const [title,setTitle]=useState(article?.title||'');
  const [slug,setSlug]=useState(article?.slug||'');
  const [slugTouched,setSlugTouched]=useState(Boolean(article?.slug));
  const [status,setStatus]=useState(article?.status||'draft');
  const [articleType,setArticleType]=useState(article?.article_type||'news');
  const [tags,setTags]=useState(initialTags.join(', '));
  const [categoryIds,setCategoryIds]=useState<string[]>(initialCategoryIds);
  const [categorySearch,setCategorySearch]=useState('');
  const [media,setMedia]=useState<Media|null>(initialMedia);
  const [mediaOpen,setMediaOpen]=useState(false);
  const [mediaItems,setMediaItems]=useState<Media[]>([]);
  const [mediaSearch,setMediaSearch]=useState('');
  const [mediaBusy,setMediaBusy]=useState(false);
  const [releaseText,setReleaseText]=useState('');
  const [sourceUrl,setSourceUrl]=useState('');
  const [converterBusy,setConverterBusy]=useState(false);
  const [converterResult,setConverterResult]=useState<ConverterResult|null>(null);

  const [form,setForm]=useState({
    subtitle:article?.subtitle||'',excerpt:article?.excerpt||'',content_html:article?.content_html||'',
    author_id:article?.author_id||'',primary_category_id:initialPrimaryCategoryId,featured_media_id:article?.featured_media_id||'',
    seo_title:article?.seo_title||'',meta_description:article?.meta_description||'',social_title:article?.social_title||'',
    social_description:article?.social_description||'',canonical_url:article?.canonical_url||'',
    published_at:article?.published_at?localDate(article.published_at):currentAucklandDate(),scheduled_at:localDate(article?.scheduled_at),
    is_breaking:Boolean(article?.is_breaking),is_featured:Boolean(article?.is_featured),
    is_editor_pick:Boolean(article?.is_editor_pick),is_homepage_hero:Boolean(article?.is_homepage_hero)
  });

  const update=(key:string,value:any)=>setForm(current=>({...current,[key]:value}));

  function setManualField(key:AutoFieldKey,value:string){
    autoManagedRef.current[key]=false;
    if(key==='tags')setTags(value);
    else update(key,value);
  }

  function handleTitleChange(value:string){
    setTitle(value);
    if(!slugTouched)setSlug(smartAutoSlug(value));

    const derived=deriveEditorialFields(form.content_html,value);
    setForm(current=>({
      ...current,
      seo_title:autoManagedRef.current.seo_title?derived.seo_title:current.seo_title,
      social_title:autoManagedRef.current.social_title?derived.social_title:current.social_title,
      subtitle:autoManagedRef.current.subtitle?derived.subtitle:current.subtitle,
      excerpt:autoManagedRef.current.excerpt?derived.excerpt:current.excerpt,
      meta_description:autoManagedRef.current.meta_description?derived.meta_description:current.meta_description,
      social_description:autoManagedRef.current.social_description?derived.social_description:current.social_description,
    }));
  }

  function handleArticleBodyChange(html:string){
    const derived=deriveEditorialFields(html,title);
    const candidateTitle=title.trim()||firstHeadingFromHtml(html)||cleanCut(firstSentence(articlePlainText(html)),90);
    const nextTags=deriveSeoTags(html,title).join(', ');

    setForm(current=>({
      ...current,
      content_html:html,
      subtitle:autoManagedRef.current.subtitle?derived.subtitle:current.subtitle,
      excerpt:autoManagedRef.current.excerpt?derived.excerpt:current.excerpt,
      seo_title:autoManagedRef.current.seo_title?derived.seo_title:current.seo_title,
      meta_description:autoManagedRef.current.meta_description?derived.meta_description:current.meta_description,
      social_title:autoManagedRef.current.social_title?derived.social_title:current.social_title,
      social_description:autoManagedRef.current.social_description?derived.social_description:current.social_description,
    }));

    if(autoManagedRef.current.tags)setTags(nextTags);
    if(!slugTouched&&candidateTitle)setSlug(smartAutoSlug(candidateTitle));
  }
  const filteredCategories=useMemo(()=>{
    const q=categorySearch.trim().toLowerCase();
    return q?categories.filter(c=>c.name.toLowerCase().includes(q)):categories;
  },[categorySearch,categories]);

  function toggleCategory(id:string){setCategoryIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id])}

  async function loadMedia(q=''){
    setMediaBusy(true);
    try{
      const r=await fetch(`/api/admin/media?q=${encodeURIComponent(q)}&limit=80`);
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Could not load media');
      setMediaItems(d.media||[]);
    }catch(e:any){setMessage(e.message||'Could not load media')}
    finally{setMediaBusy(false)}
  }

  async function openMedia(){setMediaOpen(true);if(!mediaItems.length)await loadMedia('')}

  async function uploadMedia(){
    const file=fileRef.current?.files?.[0];
    if(!file){setMessageKind('error');setMessage('Choose an image first.');return}
    if(!file.type.startsWith('image/')){setMessageKind('error');setMessage('Featured media must be an image.');return}

    setMediaBusy(true);
    setMessageKind('info');
    setMessage(`Compressing ${file.name}...`);

    try{
      const compressed=await compressImageForUpload(file,{maxBytes:2*1024*1024,maxDimension:2200});
      setMessage(`Compressed to ${formatUploadSize(compressed.size)}. Uploading...`);

      const fd=new FormData();
      fd.set('file',compressed);
      fd.set('alt_text',file.name.replace(/\.[^.]+$/,'').replaceAll('-',' ').replaceAll('_',' '));

      const r=await fetch('/api/admin/media',{method:'POST',body:fd});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Upload failed');

      setMedia(d.media);
      update('featured_media_id',d.media.id);
      setMediaItems(current=>[d.media,...current.filter(item=>item.id!==d.media.id)]);
      setMediaOpen(false);
      if(fileRef.current)fileRef.current.value='';

      setMessageKind('success');
      setMessage(`Featured image uploaded successfully (${formatUploadSize(compressed.size)}).`);
    }catch(e:any){
      setMessageKind('error');
      setMessage(e.message||'Upload failed');
    }finally{
      setMediaBusy(false);
    }
  }

  function chooseMedia(item:Media){setMedia(item);update('featured_media_id',item.id);setMediaOpen(false)}

  function applyImportedDraft(draft:any,rawText?:string){
    if(rawText)setReleaseText(rawText);
    for(const key of Object.keys(autoManagedRef.current) as AutoFieldKey[])autoManagedRef.current[key]=false;
    setTitle(draft.title||'');
    setSlug(draft.slug||slugify(draft.title||''));
    setSlugTouched(true);
    setStatus('draft');
    setArticleType(draft.article_type||'news');
    setTags((draft.tag_names||[]).join(', '));
    setCategoryIds(draft.category_ids||[]);
    setForm(current=>({
      ...current,
      subtitle:draft.subtitle||'',
      excerpt:draft.excerpt||'',
      content_html:draft.content_html||'',
      primary_category_id:draft.primary_category_id||'',
      seo_title:draft.seo_title||'',
      meta_description:draft.meta_description||'',
      social_title:draft.social_title||'',
      social_description:draft.social_description||'',
      canonical_url:'',
      is_breaking:Boolean(draft.is_breaking)
    }));
    setConverterResult({
      source_name:draft.source_name||null,
      release_date:draft.release_date||null,
      warnings:draft.warnings||[],
      stats:draft.stats||{source_words:0,article_words:0}
    });
  }

  function clearSourceOnly(){
    setReleaseText('');
    setSourceUrl('');
    setConverterResult(null);
    if(sourceFileRef.current)sourceFileRef.current.value='';
    setMessageKind('success');
    setMessage('Source cleared. The prepared article fields were left unchanged.');
  }

  function clearArticleBodyOnly(){
    if(hasMeaningfulArticleContent(form.content_html)){
      const confirmed=window.confirm('Clear the article body only? Headline, excerpt, SEO fields, source text and featured image will be kept.');
      if(!confirmed)return;
    }
    update('content_html','');
    setMessageKind('success');
    setMessage('Article body cleared. Other article fields were left unchanged.');
  }

  function clearAllFields(){
    const hasAnything=
      Boolean(title.trim()||subtitleOrExcerptPresent()||hasMeaningfulArticleContent(form.content_html)||
      releaseText.trim()||sourceUrl.trim()||slug.trim()||tags.trim()||categoryIds.length||
      form.primary_category_id||form.featured_media_id||form.seo_title||form.meta_description||
      form.social_title||form.social_description||form.canonical_url);

    if(hasAnything){
      const confirmed=window.confirm(
        'Clear this entire new article? This will remove the source, headline, subheadline, article body, excerpt, SEO/social fields, categories, tags and featured image from this unsaved form.'
      );
      if(!confirmed)return;
    }

    setTitle('');
    setSlug('');
    setSlugTouched(false);
    for(const key of Object.keys(autoManagedRef.current) as AutoFieldKey[])autoManagedRef.current[key]=true;
    setStatus('draft');
    setArticleType('news');
    setTags('');
    setCategoryIds([]);
    setCategorySearch('');
    setMedia(null);
    setReleaseText('');
    setSourceUrl('');
    setConverterResult(null);
    setForm({
      subtitle:'',
      excerpt:'',
      content_html:'',
      author_id:'',
      primary_category_id:'',
      featured_media_id:'',
      seo_title:'',
      meta_description:'',
      social_title:'',
      social_description:'',
      canonical_url:'',
      published_at:currentAucklandDate(),
      scheduled_at:'',
      is_breaking:false,
      is_featured:false,
      is_editor_pick:false,
      is_homepage_hero:false
    });

    if(fileRef.current)fileRef.current.value='';
    if(sourceFileRef.current)sourceFileRef.current.value='';

    setMessageKind('success');
    setMessage('All new-article fields cleared. You can start again with a fresh source.');
    window.setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0);
  }

  function subtitleOrExcerptPresent(){
    return Boolean(form.subtitle.trim()||form.excerpt.trim());
  }

  async function importSource(){
    if(title.trim()||hasMeaningfulArticleContent(form.content_html)){setMessageKind('error');setMessage('This article already has story content. Start from a blank new article before importing another source.');return}
    const file=sourceFileRef.current?.files?.[0];
    if(!file&&!sourceUrl.trim()){setMessage('Choose a PDF, Word or TXT file, or enter a source URL.');return}
    setConverterBusy(true);setMessageKind('info');setMessage('Reading source and preparing article draft...');
    try{
      const fd=new FormData();
      if(file)fd.set('file',file);
      else fd.set('url',sourceUrl.trim());
      fd.set('categories',JSON.stringify(categories));
      const r=await fetch('/api/admin/source-import',{method:'POST',body:fd});
      const d=await r.json();
      if(!r.ok)throw new Error(typeof d.error==='string'?d.error:JSON.stringify(d.error));
      applyImportedDraft(d.draft,d.raw_text);
      setMessageKind('success');setMessage(`Source imported from ${d.source_label||'document'}. Headline, story body and SEO fields are ready for review.`);
    }catch(e:any){setMessageKind('error');setMessage(e.message||'Could not import source')}
    finally{setConverterBusy(false)}
  }

  async function convertRelease(){
    if(releaseText.trim().length<40){setMessage('Paste the full media release before converting.');return}
    if(title.trim()||hasMeaningfulArticleContent(form.content_html)){setMessageKind('error');setMessage('This article already has story content. Start from a blank new article before importing a media release.');return}
    setConverterBusy(true);setMessageKind('info');setMessage('Preparing article draft...');
    try{
      const r=await fetch('/api/admin/media-release-converter',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({raw_text:releaseText,categories})
      });
      const d=await r.json();
      if(!r.ok)throw new Error(typeof d.error==='string'?d.error:JSON.stringify(d.error));
      const draft=d.draft;
      applyImportedDraft(draft);
      setMessageKind('success');
      setMessage('Media release converted into a draft. Headline, story body, excerpt and SEO fields have been prepared for review.');
    }catch(e:any){setMessageKind('error');setMessage(e.message||'Could not convert media release')}
    finally{setConverterBusy(false)}
  }

  function buildPayload(finalStatus:string){
    return {
      title,slug:slug||slugify(title),status:finalStatus,article_type:articleType,
      subtitle:form.subtitle||null,excerpt:form.excerpt||null,content_html:form.content_html,
      author_id:form.author_id||null,featured_media_id:form.featured_media_id||null,
      primary_category_id:form.primary_category_id||null,
      category_ids:categoryIds.filter(id=>id!==form.primary_category_id),
      tag_names:tags.split(',').map(x=>x.trim()).filter(Boolean),
      seo_title:form.seo_title||null,meta_description:form.meta_description||null,
      social_title:form.social_title||null,social_description:form.social_description||null,
      canonical_url:form.canonical_url||null,
      published_at:form.published_at?new Date(form.published_at).toISOString():null,
      scheduled_at:finalStatus==='scheduled'&&form.scheduled_at?new Date(form.scheduled_at).toISOString():null,
      is_breaking:form.is_breaking,is_featured:form.is_featured,is_editor_pick:form.is_editor_pick,is_homepage_hero:form.is_homepage_hero
    };
  }

  async function save(finalStatus=status){
    if(title.trim().length<5){setMessageKind('error');setMessage('Add a clear headline before saving.');return}
    if(finalStatus==='scheduled'&&!form.scheduled_at){setMessageKind('error');setMessage('Choose a schedule date and time.');return}
    setBusy(true);
    setMessageKind('info');
    setMessage(finalStatus==='published'?'Publishing article...':finalStatus==='scheduled'?'Scheduling article...':'Saving changes...');
    try{
      const r=await fetch(isEdit?`/api/admin/articles/${article.id}`:'/api/admin/articles',{
        method:isEdit?'PATCH':'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(buildPayload(finalStatus))
      });
      const d=await r.json().catch(()=>({error:`Server returned ${r.status}`}));      
      if(!r.ok){
        const detail=typeof d.error==='string'?d.error:d.error?.fieldErrors?Object.entries(d.error.fieldErrors).map(([key,value])=>`${key}: ${(value as string[]).join(', ')}`).join(' | '):JSON.stringify(d.error||d);
        throw new Error(detail||`Could not ${finalStatus==='published'?'publish':'save'} article.`);
      }
      if(finalStatus==='published'&&d.article?.status&&d.article.status!=='published'){
        throw new Error(`Publish request completed but the database returned status "${d.article.status}". The article was not published.`);
      }
      setStatus(finalStatus);
      setMessageKind('success');
      setMessage(finalStatus==='published'?(isEdit?'Published article updated successfully.':'Article published successfully.'):finalStatus==='scheduled'?'Article scheduled successfully.':'Changes saved.');
      if(!isEdit&&d.article?.id)router.push(`/admin/articles/${d.article.id}`);
      router.refresh();
    }catch(e:any){
      setMessageKind('error');
      setMessage(e.message||'Could not save article');
      window.setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0);
    }finally{setBusy(false)}
  }

  const selectedCategories=categories.filter(c=>categoryIds.includes(c.id)||c.id===form.primary_category_id);

  return <div className={styles.page}>
    <header className={styles.top}>
      <div><a href="/admin/articles" className={styles.back}>Back to Articles</a><span className={styles.kicker}>WEBFIT NEWSROOM</span><h1>{isEdit?'Edit Article':'New Article'}</h1>{isEdit&&<div className={styles.state}><span>{status.replaceAll('_',' ')}</span><small>Full editing remains available after publication.</small></div>}</div>
      <div className={styles.actions}>{!isEdit?<button type="button" className={styles.clearAllButton} disabled={busy||converterBusy} onClick={clearAllFields}>Clear all fields</button>:null}{isEdit?<a href="/admin/articles/new">+ New Article</a>:null}{isEdit&&article.slug?<a href={`/${article.slug}/`} target="_blank">View live</a>:null}<button type="button" disabled={busy} onClick={()=>save(status==='published'?'published':'draft')}>{busy?'Working...':isEdit?'Save changes':'Save draft'}</button><button type="button" className={styles.publish} disabled={busy} onClick={()=>save(status==='scheduled'?'scheduled':'published')}>{busy?'Working...':status==='scheduled'?'Schedule':isEdit&&status==='published'?'Update published':'Publish'}</button></div>
    </header>

    {message&&<div role="status" aria-live="polite" className={`${styles.message} ${messageKind==='error'?styles.messageError:messageKind==='success'?styles.messageSuccess:''}`}>{message}</div>}

    <div className={styles.layout}>
      <main className={styles.main}>
        {!isEdit&&<section className={`${styles.card} ${styles.converterCard}`}>
          <header className={styles.cardHead}><div><span>IMPORT</span><h2>Source importer</h2></div><small>Paste text, upload a document, or use a URL. Drafts stay unpublished until you review them.</small></header>
          <div className={styles.two}>
            <label className={styles.field}>PDF, Word or TXT file
              <input ref={sourceFileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"/>
              <small>PDF, DOC, DOCX or TXT. Uploads up to 4 MB.</small>
            </label>
            <label className={styles.field}>Source URL
              <input type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://example.govt.nz/media-release"/>
              <small>Web pages and direct PDF/Word/TXT links are supported.</small>
            </label>
          </div>
          <div className={styles.converterActions}>
            <button className={styles.convertButton} disabled={converterBusy} onClick={importSource}>{converterBusy?'Reading source...':'Prepare from file or URL'}</button>
          </div>
          <label className={styles.field}>Paste full media release<textarea className={styles.releaseInput} rows={14} value={releaseText} onChange={e=>setReleaseText(e.target.value)} placeholder="Paste the complete media release here, including its headline, date, source and body."/></label>
          <div className={styles.converterActions}>
            <button className={styles.convertButton} disabled={converterBusy||releaseText.trim().length<40} onClick={convertRelease}>{converterBusy?'Preparing draft...':'Prepare article draft'}</button>
            <button type="button" disabled={converterBusy||(!releaseText&&!sourceUrl&&!sourceFileRef.current?.files?.length)} onClick={clearSourceOnly}>Clear source only</button>
            <small>{releaseText.trim()?`${releaseText.trim().split(/\s+/).length} source words`:'Files and URLs are extracted by Webfit News. Nothing is sent to ChatGPT or another AI provider.'}</small>
          </div>
          {converterResult&&<div className={styles.converterResult}>
            <div className={styles.converterFacts}>
              <span><b>Source</b>{converterResult.source_name||'Check manually'}</span>
              <span><b>Release date</b>{converterResult.release_date||'Check manually'}</span>
              <span><b>Draft size</b>{converterResult.stats.article_words} words</span>
            </div>
            {converterResult.warnings.length>0&&<div className={styles.converterWarnings}><strong>Review before publishing</strong>{converterResult.warnings.map((warning,index)=><p key={`${warning}-${index}`}>{warning}</p>)}</div>}
          </div>}
        </section>}

        <section className={styles.card}>
          <header className={styles.cardHead}><div><span>STORY</span><h2>Article content</h2></div><small>Visual editor. What you see here is close to the published article.</small></header>
          <label className={styles.field}>Headline<input className={styles.headline} value={title} onChange={e=>handleTitleChange(e.target.value)} placeholder="Write a clear, specific headline"/></label>
          <label className={styles.field}>Subheadline / standfirst<textarea rows={3} value={form.subtitle} onChange={e=>setManualField('subtitle',e.target.value)} placeholder="Optional summary beneath the headline"/></label>
          <div className={styles.field}><div className={styles.fieldToolbar}><span>Article body</span><button type="button" className={styles.clearBodyButton} onClick={clearArticleBodyOnly} disabled={!hasMeaningfulArticleContent(form.content_html)}>Clear article body</button></div><RichArticleEditor value={form.content_html} onChange={handleArticleBodyChange} placeholder="Write or paste the article here"/></div>
          <label className={styles.field}>Excerpt<textarea rows={4} value={form.excerpt} onChange={e=>setManualField('excerpt',e.target.value)} placeholder="Short summary used on story cards"/></label>
        </section>

        <section className={styles.card}>
          <header className={styles.cardHead}><div><span>SEO</span><h2>Search and social</h2></div><small>Auto-filled from the article until you edit a field yourself.</small></header>
          <div className={styles.two}><label className={styles.field}>SEO title<input value={form.seo_title} onChange={e=>setManualField('seo_title',e.target.value)}/><small className={form.seo_title.length>90?styles.over:''}>{form.seo_title.length}/90 recommended</small></label><label className={styles.field}>Slug<input value={slug} onChange={e=>{setSlugTouched(true);setSlug(slugify(e.target.value).slice(0,90))}}/></label></div>
          <label className={styles.field}>Meta description<textarea rows={3} value={form.meta_description} onChange={e=>setManualField('meta_description',e.target.value)}/><small className={form.meta_description.length>180?styles.over:''}>{form.meta_description.length}/180 recommended</small></label>
          <div className={styles.two}><label className={styles.field}>Social title<input value={form.social_title} onChange={e=>setManualField('social_title',e.target.value)}/><small className={form.social_title.length>110?styles.over:''}>{form.social_title.length}/110 recommended</small></label><label className={styles.field}>Canonical URL<input value={form.canonical_url} onChange={e=>update('canonical_url',e.target.value)} placeholder="Leave blank for article URL"/></label></div>
          <label className={styles.field}>Social description<textarea rows={3} value={form.social_description} onChange={e=>setManualField('social_description',e.target.value)}/><small className={form.social_description.length>220?styles.over:''}>{form.social_description.length}/220 recommended</small></label>
        </section>

        {isEdit&&<section className={styles.card}><header className={styles.cardHead}><div><span>HISTORY</span><h2>Revision history</h2></div></header>{revisions.length?<div className={styles.revisions}>{revisions.map(r=><div key={r.id}><strong>{formatRevisionDate(r.created_at)}</strong><span>{r.title}</span></div>)}</div>:<p className={styles.note}>No previous revisions yet.</p>}</section>}
      </main>

      <aside className={styles.side}>
        <section className={styles.card}><header className={styles.cardHead}><div><span>PUBLISHING</span><h2>Publish settings</h2></div></header>
          <label className={styles.field}>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="draft">Draft</option><option value="in_review">In review</option><option value="scheduled">Scheduled</option><option value="published">Published</option>{isEdit&&<option value="archived">Archived</option>}</select></label>
          <label className={styles.field}>Article type<select value={articleType} onChange={e=>setArticleType(e.target.value)}>{types.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
          <label className={styles.field}>Author<select value={form.author_id} onChange={e=>update('author_id',e.target.value)}><option value="">Webfit News</option>{authors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label className={styles.field}>Publish date<input type="datetime-local" value={form.published_at} onChange={e=>update('published_at',e.target.value)}/></label>
          {status==='scheduled'&&<label className={styles.field}>Schedule for<input type="datetime-local" value={form.scheduled_at} onChange={e=>update('scheduled_at',e.target.value)}/></label>}
        </section>

        <section className={styles.card}><header className={styles.cardHead}><div><span>IMAGE</span><h2>Featured image</h2></div><small>16:9 recommended</small></header>
          {media?.public_url?<div className={styles.featured}><img src={media.public_url} alt={media.alt_text||media.filename||''}/><strong>{media.filename||'Featured image'}</strong><small>{media.width&&media.height?`${media.width} × ${media.height}`:'Image selected'}</small><div><button onClick={openMedia}>Change image</button><button onClick={()=>{setMedia(null);update('featured_media_id','')}}>Remove</button></div></div>:<button className={styles.addImage} onClick={openMedia}><b>+</b><strong>Add featured image</strong><small>Upload new or browse Media Library</small></button>}
        </section>

        <section className={styles.card}><header className={styles.cardHead}><div><span>CLASSIFICATION</span><h2>Categories and tags</h2></div></header>
          <label className={styles.field}>Primary category<select value={form.primary_category_id} onChange={e=>update('primary_category_id',e.target.value)}><option value="">Select primary category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          {selectedCategories.length>0&&<div className={styles.chips}>{selectedCategories.map(c=><span key={c.id}>{c.name}{c.id===form.primary_category_id?' • Primary':''}</span>)}</div>}
          <div className={styles.categoryBox}><input value={categorySearch} onChange={e=>setCategorySearch(e.target.value)} placeholder="Search categories"/><div>{filteredCategories.map(c=><label key={c.id}><input type="checkbox" checked={categoryIds.includes(c.id)||c.id===form.primary_category_id} disabled={c.id===form.primary_category_id} onChange={()=>toggleCategory(c.id)}/><span>{c.name}</span></label>)}</div></div>
          <label className={styles.field}>Tags<textarea rows={3} value={tags} onChange={e=>setManualField('tags',e.target.value)} placeholder="Auckland, politics, community"/><small>Separate tags with commas.</small></label>
        </section>

        <section className={styles.card}><header className={styles.cardHead}><div><span>PLACEMENT</span><h2>Homepage options</h2></div></header><div className={styles.toggles}>{[['is_breaking','Breaking News'],['is_featured','Featured'],['is_editor_pick',"Editor's Pick"],['is_homepage_hero','Homepage Hero']].map(([k,l])=><label key={k}><input type="checkbox" checked={(form as any)[k]} onChange={e=>update(k,e.target.checked)}/><span>{l}</span></label>)}</div></section>
      </aside>
    </div>

    {mediaOpen&&<div className={styles.modal}>
      <button className={styles.backdrop} aria-label="Close media library" onClick={()=>setMediaOpen(false)}/>
      <div className={styles.dialog}>
        <header><div><span>WEBFIT NEWSROOM</span><h2>Choose featured image</h2><p>Upload a new image or select an existing newsroom image.</p></div><button onClick={()=>setMediaOpen(false)}>Close</button></header>
        <div className={styles.upload}><div><strong>Upload new image</strong><small>JPG, PNG, WebP or AVIF. Large images are automatically compressed to a maximum of 2 MB.</small></div><input ref={fileRef} type="file" accept="image/*"/><button disabled={mediaBusy} onClick={uploadMedia}>{mediaBusy?'Uploading...':'Upload and use'}</button></div>
        <div className={styles.mediaSearch}><input value={mediaSearch} onChange={e=>setMediaSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')loadMedia(mediaSearch)}} placeholder="Search filename, caption or alt text"/><button onClick={()=>loadMedia(mediaSearch)}>Search</button></div>
        {mediaBusy?<div className={styles.loading}>Loading images...</div>:<div className={styles.mediaGrid}>{mediaItems.map(item=><button key={item.id} onClick={()=>chooseMedia(item)}><span>{item.public_url?<img src={item.public_url} alt={item.alt_text||item.filename||''}/>:null}</span><strong>{item.filename||'Untitled image'}</strong><small>{item.width&&item.height?`${item.width} × ${item.height}`:'Image'}</small></button>)}</div>}
      </div>
    </div>}
  </div>;
}
