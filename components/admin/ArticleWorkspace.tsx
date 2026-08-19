'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ArticleWorkspace.module.css';
import { RichArticleEditor } from './RichArticleEditor';

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
    if(!file){setMessage('Choose an image first.');return}
    if(!file.type.startsWith('image/')){setMessage('Featured media must be an image.');return}
    setMediaBusy(true);setMessage('');
    try{
      const fd=new FormData();
      fd.set('file',file);
      fd.set('alt_text',file.name.replace(/\.[^.]+$/,'').replaceAll('-',' ').replaceAll('_',' '));
      const r=await fetch('/api/admin/media',{method:'POST',body:fd});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Upload failed');
      setMedia(d.media);
      update('featured_media_id',d.media.id);
      setMediaItems(current=>[d.media,...current]);
      setMediaOpen(false);
      if(fileRef.current)fileRef.current.value='';
    }catch(e:any){setMessage(e.message||'Upload failed')}
    finally{setMediaBusy(false)}
  }

  function chooseMedia(item:Media){setMedia(item);update('featured_media_id',item.id);setMediaOpen(false)}

  function applyImportedDraft(draft:any,rawText?:string){
    if(rawText)setReleaseText(rawText);
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

  async function importSource(){
    if(title.trim()||form.content_html.trim()){setMessage('This article already has story content. Start from a blank new article before importing another source.');return}
    const file=sourceFileRef.current?.files?.[0];
    if(!file&&!sourceUrl.trim()){setMessage('Choose a PDF, Word or TXT file, or enter a source URL.');return}
    setConverterBusy(true);setMessage('');
    try{
      const fd=new FormData();
      if(file)fd.set('file',file);
      else fd.set('url',sourceUrl.trim());
      fd.set('categories',JSON.stringify(categories));
      const r=await fetch('/api/admin/source-import',{method:'POST',body:fd});
      const d=await r.json();
      if(!r.ok)throw new Error(typeof d.error==='string'?d.error:JSON.stringify(d.error));
      applyImportedDraft(d.draft,d.raw_text);
      setMessage(`Source imported from ${d.source_label||'document'}. Review the article, attribution, category and SEO before publishing.`);
    }catch(e:any){setMessage(e.message||'Could not import source')}
    finally{setConverterBusy(false)}
  }

  async function convertRelease(){
    if(releaseText.trim().length<40){setMessage('Paste the full media release before converting.');return}
    if(title.trim()||form.content_html.trim()){setMessage('This article already has story content. Start from a blank new article before importing a media release.');return}
    setConverterBusy(true);setMessage('');
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
      setMessage('Media release converted into a draft. Review the story, attribution, category and SEO before publishing.');
    }catch(e:any){setMessage(e.message||'Could not convert media release')}
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
      <div className={styles.actions}>{isEdit?<a href="/admin/articles/new">+ New Article</a>:null}{isEdit&&article.slug?<a href={`/${article.slug}/`} target="_blank">View live</a>:null}<button type="button" disabled={busy} onClick={()=>save(status==='published'?'published':'draft')}>{busy?'Working...':isEdit?'Save changes':'Save draft'}</button><button type="button" className={styles.publish} disabled={busy} onClick={()=>save(status==='scheduled'?'scheduled':'published')}>{busy?'Working...':status==='scheduled'?'Schedule':isEdit&&status==='published'?'Update published':'Publish'}</button></div>
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
            <button disabled={converterBusy||(!releaseText&&!sourceUrl)} onClick={()=>{setReleaseText('');setSourceUrl('');setConverterResult(null);if(sourceFileRef.current)sourceFileRef.current.value=''}}>Clear source</button>
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
          <label className={styles.field}>Headline<input className={styles.headline} value={title} onChange={e=>{setTitle(e.target.value);if(!slugTouched)setSlug(slugify(e.target.value))}} placeholder="Write a clear, specific headline"/></label>
          <label className={styles.field}>Subheadline / standfirst<textarea rows={3} value={form.subtitle} onChange={e=>update('subtitle',e.target.value)} placeholder="Optional summary beneath the headline"/></label>
          <div className={styles.field}><span>Article body</span><RichArticleEditor value={form.content_html} onChange={html=>update('content_html',html)} placeholder="Write or paste the article here"/></div>
          <label className={styles.field}>Excerpt<textarea rows={4} value={form.excerpt} onChange={e=>update('excerpt',e.target.value)} placeholder="Short summary used on story cards"/></label>
        </section>

        <section className={styles.card}>
          <header className={styles.cardHead}><div><span>SEO</span><h2>Search and social</h2></div></header>
          <div className={styles.two}><label className={styles.field}>SEO title<input value={form.seo_title} onChange={e=>update('seo_title',e.target.value)}/><small className={form.seo_title.length>60?styles.over:''}>{form.seo_title.length}/60 recommended</small></label><label className={styles.field}>Slug<input value={slug} onChange={e=>{setSlugTouched(true);setSlug(slugify(e.target.value))}}/></label></div>
          <label className={styles.field}>Meta description<textarea rows={3} value={form.meta_description} onChange={e=>update('meta_description',e.target.value)}/><small className={form.meta_description.length>160?styles.over:''}>{form.meta_description.length}/160 recommended</small></label>
          <div className={styles.two}><label className={styles.field}>Social title<input value={form.social_title} onChange={e=>update('social_title',e.target.value)}/></label><label className={styles.field}>Canonical URL<input value={form.canonical_url} onChange={e=>update('canonical_url',e.target.value)} placeholder="Leave blank for article URL"/></label></div>
          <label className={styles.field}>Social description<textarea rows={3} value={form.social_description} onChange={e=>update('social_description',e.target.value)}/></label>
        </section>

        {isEdit&&<section className={styles.card}><header className={styles.cardHead}><div><span>HISTORY</span><h2>Revision history</h2></div></header>{revisions.length?<div className={styles.revisions}>{revisions.map(r=><div key={r.id}><strong>{new Date(r.created_at).toLocaleString('en-NZ')}</strong><span>{r.title}</span></div>)}</div>:<p className={styles.note}>No previous revisions yet.</p>}</section>}
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
          <label className={styles.field}>Tags<textarea rows={3} value={tags} onChange={e=>setTags(e.target.value)} placeholder="Auckland, politics, community"/><small>Separate tags with commas.</small></label>
        </section>

        <section className={styles.card}><header className={styles.cardHead}><div><span>PLACEMENT</span><h2>Homepage options</h2></div></header><div className={styles.toggles}>{[['is_breaking','Breaking News'],['is_featured','Featured'],['is_editor_pick',"Editor's Pick"],['is_homepage_hero','Homepage Hero']].map(([k,l])=><label key={k}><input type="checkbox" checked={(form as any)[k]} onChange={e=>update(k,e.target.checked)}/><span>{l}</span></label>)}</div></section>
      </aside>
    </div>

    {mediaOpen&&<div className={styles.modal}>
      <button className={styles.backdrop} aria-label="Close media library" onClick={()=>setMediaOpen(false)}/>
      <div className={styles.dialog}>
        <header><div><span>WEBFIT NEWSROOM</span><h2>Choose featured image</h2><p>Upload a new image or select an existing newsroom image.</p></div><button onClick={()=>setMediaOpen(false)}>Close</button></header>
        <div className={styles.upload}><div><strong>Upload new image</strong><small>JPG, PNG, WebP or AVIF. Maximum 20 MB.</small></div><input ref={fileRef} type="file" accept="image/*"/><button disabled={mediaBusy} onClick={uploadMedia}>{mediaBusy?'Uploading...':'Upload and use'}</button></div>
        <div className={styles.mediaSearch}><input value={mediaSearch} onChange={e=>setMediaSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')loadMedia(mediaSearch)}} placeholder="Search filename, caption or alt text"/><button onClick={()=>loadMedia(mediaSearch)}>Search</button></div>
        {mediaBusy?<div className={styles.loading}>Loading images...</div>:<div className={styles.mediaGrid}>{mediaItems.map(item=><button key={item.id} onClick={()=>chooseMedia(item)}><span>{item.public_url?<img src={item.public_url} alt={item.alt_text||item.filename||''}/>:null}</span><strong>{item.filename||'Untitled image'}</strong><small>{item.width&&item.height?`${item.width} × ${item.height}`:'Image'}</small></button>)}</div>}
      </div>
    </div>}
  </div>;
}
