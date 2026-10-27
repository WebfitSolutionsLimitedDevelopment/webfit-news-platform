import Link from 'next/link';
import { AdminHeader, AdminShell, StatusBadge } from '../../../components/admin/AdminShell';
import { getArticlesAdmin } from '../../../lib/admin-data';
import { requireAdmin, isWriterRole } from '../../../lib/admin-auth';

const nzTime=(v:string)=>new Intl.DateTimeFormat('en-NZ',{timeZone:'Pacific/Auckland',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(new Date(v));

/** What a story's state means, in plain words. */
function stateLabel(a:any){
  if(a.status==='in_review')return <span className="status-badge status-in-review">waiting for review</span>;
  if(a.status==='draft'&&a.review_note)return <span className="status-badge status-disabled">changes requested</span>;
  return <StatusBadge status={a.status}/>;
}

function hrefFor(params:Record<string,string|number|undefined>){
  const sp=new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{if(v!==undefined && v!=='' && v!=='all')sp.set(k,String(v))});
  const qs=sp.toString(); return `/admin/articles${qs?`?${qs}`:''}`;
}

export default async function Articles({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const raw=await searchParams;
  const q=typeof raw.q==='string'?raw.q:'';
  const status=typeof raw.status==='string'?raw.status:'all';
  const type=typeof raw.type==='string'?raw.type:'all';
  const page=Math.max(1,Number(typeof raw.page==='string'?raw.page:'1')||1);
  const { supabase, profile } = await requireAdmin();
  const writer=isWriterRole(profile.role);
  const [result,{count:waiting},{count:returned}]=await Promise.all([
    getArticlesAdmin({q,status,type,page,pageSize:30}),
    supabase.from('articles').select('id',{count:'exact',head:true}).eq('status','in_review'),
    supabase.from('articles').select('id',{count:'exact',head:true}).eq('status','draft').not('review_note','is',null),
  ]);
  const tabs:Array<[string,string,number|null]>=writer
    ?[['all','All my stories',null],['returned','Changes requested',returned||0],['in_review','Waiting for review',waiting||0],['draft','Drafts',null],['published','Published',null]]
    :[['all','All stories',null],['in_review','Waiting for review',waiting||0],['returned','Sent back',returned||0],['draft','Drafts',null],['published','Published',null]];
  return <AdminShell active={writer?'My stories':'Articles'}><AdminHeader title={writer?'My stories':'Articles'} description={writer?'Write a story, then submit it. The editor publishes it or sends it back with a comment.':'Search, review, schedule and publish newsroom content.'} actions={<Link className="admin-primary" href="/admin/articles/new">{writer?'+ New story':'+ New Article'}</Link>}/>
    <nav style={{display:'flex',gap:6,flexWrap:'wrap',margin:'0 0 12px'}}>{tabs.map(([k,l,n])=><Link key={k} href={hrefFor({q,type,status:k})} className={status===k?'admin-primary':'admin-secondary'} style={{padding:'6px 12px'}}>{l}{n?<b style={{marginLeft:6,background:k==='in_review'&&!writer?'#c8232c':'#152238',color:'#fff',borderRadius:999,padding:'1px 7px',fontSize:11}}>{n}</b>:null}</Link>)}</nav>
    <form className="admin-toolbar" method="get">
      <input name="q" defaultValue={q} placeholder="Search headline or slug"/>
      <select name="status" defaultValue={status}><option value="all">All statuses</option><option value="returned">{writer?'Changes requested':'Sent back'}</option><option value="published">Published</option><option value="draft">Draft</option><option value="in_review">In review</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select>
      <select name="type" defaultValue={type}><option value="all">All types</option><option value="news">News</option><option value="breaking_news">Breaking news</option><option value="feature">Feature</option><option value="analysis">Analysis</option><option value="opinion">Opinion</option><option value="editorial">Editorial</option><option value="explainer">Explainer</option><option value="interview">Interview</option><option value="community">Community</option><option value="press_release">Press release</option></select>
      <button className="admin-secondary" type="submit">Filter</button>
      {(q||status!=='all'||type!=='all')&&<Link className="admin-text-link" href="/admin/articles">Clear</Link>}
    </form>
    <div className="admin-list-summary"><strong>{result.count}</strong> article{result.count===1?'':'s'} found</div>
    <div className="admin-card"><div className="admin-table-wrap"><table><thead><tr><th>Story</th><th>Type</th><th>Status</th><th>{status==='in_review'?'Submitted':'Publish time'}</th><th title="Page views counted by Webfit News since 27 Oct 2026">Views</th><th></th></tr></thead><tbody>{result.items.length?result.items.map((a:any)=><tr key={a.id}><td><div className="story-row">{a.media?.public_url?<img src={a.media.public_url} alt=""/>:<div className="story-thumb"/>}<div><strong>{a.title}</strong><small>/{a.slug}/</small>{a.author?.name&&<small>{a.created_by&&!writer?'Reporter: ':''}{a.author.name}</small>}{a.status==='draft'&&a.review_note?<small style={{color:'#a32323'}}>Editor: {String(a.review_note).slice(0,90)}{String(a.review_note).length>90?'…':''}</small>:null}</div></div></td><td>{a.article_type.replaceAll('_',' ')}</td><td>{stateLabel(a)}</td><td>{a.status==='in_review'&&a.submitted_at?nzTime(a.submitted_at):a.status==='scheduled'&&a.scheduled_at?new Date(a.scheduled_at).toLocaleString('en-NZ',{timeZone:'Pacific/Auckland'}):a.published_at?new Date(a.published_at).toLocaleString('en-NZ',{timeZone:'Pacific/Auckland'}):'-'}</td><td>{a.status==='published'?<Link href={`/admin/analytics?story=${a.id}&period=30d`}>{Number(a.view_count||0).toLocaleString('en-NZ')}</Link>:'-'}</td><td><Link href={`/admin/articles/${a.id}`}>{writer?(a.status==='draft'?'Edit':'Open'):a.status==='in_review'?<strong>Review</strong>:'Edit'}</Link></td></tr>):<tr><td colSpan={6}>No articles match these filters.</td></tr>}</tbody></table></div></div>
    {result.pages>1&&<nav className="admin-pagination" aria-label="Article pages"><span>Page {result.page} of {result.pages}</span><div>{result.page>1&&<Link href={hrefFor({q,status,type,page:result.page-1})}>Previous</Link>}{result.page<result.pages&&<Link href={hrefFor({q,status,type,page:result.page+1})}>Next</Link>}</div></nav>}
  </AdminShell>
}
