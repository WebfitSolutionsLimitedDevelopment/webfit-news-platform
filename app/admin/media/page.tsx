import MediaUploader from '../../../components/admin/MediaUploader';
import { AdminHeader, AdminShell, StatusBadge } from '../../../components/admin/AdminShell';
import { getMediaAdmin } from '../../../lib/admin-data';

export default async function Media(){
  const items=await getMediaAdmin();
  return <AdminShell active="Media">
    <AdminHeader title="Media Library" description="Upload editorial images, campaign artwork and short video creatives." actions={<MediaUploader/>}/>
    <div className="admin-toolbar"><input placeholder="Search media"/><select><option>All migration states</option><option>Migrated</option><option>Pending</option><option>Failed</option></select></div>
    <div className="media-grid">{items.length?items.map((item:any)=><article className="media-card" key={item.id}>
      <div className="media-preview">
        {item.public_url&&item.mime_type?.startsWith('image/')?<img src={item.public_url} alt={item.alt_text||''}/>:null}
        {item.public_url&&item.mime_type?.startsWith('video/')?<video src={item.public_url} controls muted playsInline preload="metadata"/>:null}
        {!item.mime_type?.startsWith('image/')&&!item.mime_type?.startsWith('video/')?<span>FILE</span>:null}
      </div>
      <strong>{item.title||item.filename||'Untitled asset'}</strong><small>{item.filename}</small><StatusBadge status={item.migration_status}/>
    </article>):<div className="admin-empty">No media records yet. Upload an image, PDF or MP4/MOV video.</div>}</div>
  </AdminShell>;
}
