import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { readImageSize } from '@/lib/image-dimensions';

async function ctx(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();if(!profile?.is_active)return null;return{supabase,user,profile}}

export async function GET(req:Request){
  const c=await ctx();
  if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});
  const url=new URL(req.url);
  const q=(url.searchParams.get('q')||'').trim().replaceAll(',',' ');
  const rawLimit=Number(url.searchParams.get('limit')||60);
  const rawPage=Number(url.searchParams.get('page')||1);
  const limit=Number.isFinite(rawLimit)?Math.min(Math.max(Math.floor(rawLimit),1),100):60;
  const page=Number.isSafeInteger(rawPage)&&rawPage>0?rawPage:1;
  const offset=(page-1)*limit;
  if(!Number.isSafeInteger(offset+limit))return NextResponse.json({error:'Invalid page'},{status:400});
  // Keep existing unpaginated consumers compatible, including their response shape.
  const paginated=url.searchParams.has('page');
  let query=c.supabase.from('media').select('id,public_url,alt_text,caption,credit,filename,mime_type,width,height,created_at,uploaded_by',paginated?{count:'exact'}:{})
    .or('mime_type.is.null,mime_type.ilike.image/%').order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+limit-1);
  if(c.profile.role==='volunteer')query=query.eq('uploaded_by',c.user.id);
  if(q)query=query.or(`filename.ilike.%${q}%,alt_text.ilike.%${q}%,caption.ilike.%${q}%`);
  const {data,error,count}=await query;
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json(paginated?{media:data,page,total:count??0,totalPages:Math.max(1,Math.ceil((count??0)/limit))}:{media:data});
}

export async function POST(req:Request){
  const c=await ctx();
  if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});
  const form=await req.formData();
  const file=form.get('file');
  if(!(file instanceof File))return NextResponse.json({error:'File is required'},{status:422});
  const image=file.type.startsWith('image/');
  const volunteer=c.profile.role==='volunteer';
  if(volunteer&&!['image/jpeg','image/png','image/webp','image/avif','image/gif'].includes(file.type))
    return NextResponse.json({error:'Choose a JPEG, PNG, WebP, AVIF or GIF image.'},{status:422});
  if(image&&file.size>512*1024)return NextResponse.json({error:'Optimised image exceeds 512 KB limit'},{status:413});
  if(!image&&file.size>2*1024*1024)return NextResponse.json({error:'File exceeds 2 MB limit'},{status:413});
  const size=image?readImageSize(await file.slice(0,256*1024).arrayBuffer()):null;
  if(volunteer&&!size)return NextResponse.json({error:'The image could not be read.'},{status:422});
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
  const d=new Date();
  const prefix=volunteer?`volunteer/${c.user.id}`:`${d.getUTCFullYear()}/${String(d.getUTCMonth()+1).padStart(2,'0')}`;
  const path=`${prefix}/${crypto.randomUUID()}-${safe}`;
  // The volunteer role has no storage write grant. This route can only add a fresh, caller-owned image.
  const db=volunteer?createAdminClient():c.supabase;
  const bucket=db.storage.from('news-media');
  const {error:uploadError}=await bucket.upload(path,file,{contentType:file.type||'application/octet-stream',cacheControl:'31536000',upsert:false});
  if(uploadError)return NextResponse.json({error:uploadError.message},{status:400});
  const {data:pub}=bucket.getPublicUrl(path);
  const {data,error}=await db.from('media').insert({
    width:size?.width??null,height:size?.height??null,uploaded_by:c.user.id,storage_bucket:'news-media',
    storage_path:path,public_url:pub.publicUrl,filename:file.name,mime_type:file.type||null,file_size:file.size,
    alt_text:String(form.get('alt_text')||'').slice(0,250),caption:String(form.get('caption')||'').slice(0,1000),
    credit:String(form.get('credit')||'').slice(0,1000),migration_status:'native',
  }).select('*').single();
  if(error){
    if(volunteer)await bucket.remove([path]);
    return NextResponse.json({error:error.message},{status:400});
  }
  await db.from('audit_log').insert({actor_id:c.user.id,action:'media.upload',entity_type:'media',entity_id:data.id,metadata:{filename:file.name,size:file.size}});
  return NextResponse.json({media:data},{status:201});
}

/** Update an image's alt text (and optionally caption/credit) from the newsroom. */
export async function PATCH(req:Request){
  const c=await ctx();
  if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  const id=typeof body?.id==='string'?body.id:'';
  if(!id)return NextResponse.json({error:'id is required'},{status:422});
  const patch:Record<string,string>={};
  for(const key of ['alt_text','caption','credit']){
    if(typeof body?.[key]==='string')patch[key]=body[key].trim().slice(0,key==='alt_text'?250:1000);
  }
  if(!Object.keys(patch).length)return NextResponse.json({error:'Nothing to update'},{status:422});
  const volunteer=c.profile.role==='volunteer';
  const db=volunteer?createAdminClient():c.supabase;
  if(volunteer){
    const {data:media,error}=await db.from('media').select('id').eq('id',id).eq('uploaded_by',c.user.id).maybeSingle();
    if(error||!media)return NextResponse.json({error:'Image not found.'},{status:404});
    const {data:locked,error:lookupError}=await db.from('articles').select('id').eq('featured_media_id',id)
      .not('status','in','(draft,rejected)').limit(1);
    if(lookupError||locked?.length)return NextResponse.json({error:'This image is already attached to a submitted or published story.'},{status:409});
  }
  let query=db.from('media').update(patch).eq('id',id);
  if(volunteer)query=query.eq('uploaded_by',c.user.id);
  const {data,error}=await query.select('id,public_url,alt_text,caption,credit,filename,width,height,uploaded_by').single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({media:data});
}
