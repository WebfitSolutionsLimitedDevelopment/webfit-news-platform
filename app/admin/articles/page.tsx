import Link from 'next/link';
import { AdminHeader, AdminShell, StatusBadge } from '../../../components/admin/AdminShell';
import { getArticlesAdmin } from '../../../lib/admin-data';

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
  const result=await getArticlesAdmin({q,status,type,page,pageSize:30});
  return <AdminShell active="Articles"><AdminHeader title="Articles" description="Search, review, schedule and publish newsroom content." actions={<Link className="admin-primary" href="/admin/articles/new">+ New Article</Link>}/>
    <form className="admin-toolbar" method="get">
      <input name="q" defaultValue={q} placeholder="Search headline or slug"/>
      <select name="status" defaultValue={status}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="in_review">In review</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select>
      <select name="type" defaultValue={type}><option value="all">All types</option><option value="news">News</option><option value="breaking_news">Breaking news</option><option value="feature">Feature</option><option value="analysis">Analysis</option><option value="opinion">Opinion</option><option value="editorial">Editorial</option><option value="explainer">Explainer</option><option value="interview">Interview</option><option value="community">Community</option><option value="press_release">Press release</option></select>
      <button className="admin-secondary" type="submit">Filter</button>
      {(q||status!=='all'||type!=='all')&&<Link className="admin-text-link" href="/admin/articles">Clear</Link>}
    </form>
    <div className="admin-list-summary"><strong>{result.count}</strong> article{result.count===1?'':'s'} found</div>
    <div className="admin-card"><div className="admin-table-wrap"><table><thead><tr><th>Story</th><th>Type</th><th>Status</th><th>Publish time</th><th></th></tr></thead><tbody>{result.items.length?result.items.map((a:any)=><tr key={a.id}><td><div className="story-row">{a.media?.public_url?<img src={a.media.public_url} alt=""/>:<div className="story-thumb"/>}<div><strong>{a.title}</strong><small>/{a.slug}/</small>{a.author?.name&&<small>{a.author.name}</small>}</div></div></td><td>{a.article_type.replaceAll('_',' ')}</td><td><StatusBadge status={a.status}/></td><td>{a.status==='scheduled'&&a.scheduled_at?new Date(a.scheduled_at).toLocaleString('en-NZ',{timeZone:'Pacific/Auckland'}):a.published_at?new Date(a.published_at).toLocaleString('en-NZ',{timeZone:'Pacific/Auckland'}):'-'}</td><td><Link href={`/admin/articles/${a.id}`}>Edit</Link></td></tr>):<tr><td colSpan={5}>No articles match these filters.</td></tr>}</tbody></table></div></div>
    {result.pages>1&&<nav className="admin-pagination" aria-label="Article pages"><span>Page {result.page} of {result.pages}</span><div>{result.page>1&&<Link href={hrefFor({q,status,type,page:result.page-1})}>Previous</Link>}{result.page<result.pages&&<Link href={hrefFor({q,status,type,page:result.page+1})}>Next</Link>}</div></nav>}
  </AdminShell>
}
