import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../../lib/supabase-server';

const MAX_VIDEO_SIZE=140*1024*1024;
const Input=z.object({
  path:z.string().min(1),
  filename:z.string().trim().min(1).max(240),
  mime_type:z.enum(['video/mp4','video/quicktime']),
  file_size:z.number().int().positive().max(MAX_VIDEO_SIZE),
  alt_text:z.string().max(240).optional().default('')
});

async function context(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data:profile}=await supabase.from('profiles').select('is_active').eq('id',user.id).maybeSingle();
  if(!profile?.is_active)return null;
  return {supabase,user};
}

export async function POST(req:Request){
  const c=await context();
  if(!c)return NextResponse.json({error:'Sign in with an active newsroom account to upload video.'},{status:403});
  const parsed=Input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Invalid video upload details.',details:parsed.error.flatten()},{status:422});
  const {path,filename,mime_type,file_size,alt_text}=parsed.data;
  const parts=path.split('/');
  if(parts.length!==3||parts[0]!==c.user.id||parts[1]!=='videos'||!/^[a-z0-9-]{36}-[a-z0-9._-]+$/i.test(parts[2])){
    return NextResponse.json({error:'The uploaded video path is invalid.'},{status:403});
  }

  const {data:existing}=await c.supabase.from('media').select('*').eq('storage_path',path).maybeSingle();
  if(existing)return NextResponse.json({media:existing});

  const {data:objects,error:storageError}=await c.supabase.storage.from('news-media').list(parts[0]+'/videos',{search:parts[2],limit:10});
  if(storageError)return NextResponse.json({error:'Could not verify the uploaded video: '+storageError.message},{status:400});
  const object=objects?.find(item=>item.name===parts[2]);
  if(!object)return NextResponse.json({error:'The video upload is not complete yet. Wait for it to finish, then retry.'},{status:409});
  const actualSize=Number((object.metadata as any)?.size||0);
  if(actualSize&&actualSize!==file_size)return NextResponse.json({error:'Uploaded video size did not match the selected file.'},{status:422});
  if(actualSize>MAX_VIDEO_SIZE)return NextResponse.json({error:'Video must be 140 MB or smaller.'},{status:413});

  const {data:publicData}=c.supabase.storage.from('news-media').getPublicUrl(path);
  const {data,error}=await c.supabase.from('media').insert({
    uploaded_by:c.user.id,storage_bucket:'news-media',storage_path:path,public_url:publicData.publicUrl,
    filename,mime_type,file_size,alt_text,caption:'',credit:'',migration_status:'native'
  }).select('*').single();
  if(error)return NextResponse.json({error:'Video uploaded but the Media Library record could not be saved: '+error.message},{status:400});
  await c.supabase.from('audit_log').insert({actor_id:c.user.id,action:'media.video_upload',entity_type:'media',entity_id:data.id,metadata:{filename,size:file_size}});
  return NextResponse.json({media:data},{status:201});
}
