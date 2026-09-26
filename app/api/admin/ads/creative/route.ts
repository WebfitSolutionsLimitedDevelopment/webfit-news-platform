import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../../lib/supabase-server';

const Input=z.object({
  campaign_id:z.string().uuid(),
  media_id:z.string().uuid(),
  poster_media_id:z.string().uuid().nullable().optional(),
  headline:z.string().trim().max(160).nullable().optional(),
  destination_url:z.string().url(),
  alt_text:z.string().trim().max(240).nullable().optional()
});
async function context(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!profile?.is_active||!['super_admin','editor','ad_manager'].includes(profile.role))return null;
  return {supabase,user};
}
export async function POST(req:Request){
  const c=await context();
  if(!c)return NextResponse.json({error:'Advertising permission required'},{status:403});
  const parsed=Input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Invalid creative',details:parsed.error.flatten()},{status:422});
  const {media_id,poster_media_id,...creative}=parsed.data;
  const {data:asset,error:assetError}=await c.supabase.from('media').select('id,mime_type').eq('id',media_id).maybeSingle();
  if(assetError)return NextResponse.json({error:'Could not check the selected media: '+assetError.message},{status:400});
  if(!asset||!['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/quicktime'].includes(asset.mime_type||'')){
    return NextResponse.json({error:'Choose a supported image or MP4/MOV video from the Media Library.'},{status:422});
  }
  if(poster_media_id){
    const {data:poster,error:posterError}=await c.supabase.from('media').select('id,mime_type').eq('id',poster_media_id).maybeSingle();
    if(posterError)return NextResponse.json({error:'Could not check the poster image: '+posterError.message},{status:400});
    if(!poster||!String(poster.mime_type||'').startsWith('image/'))return NextResponse.json({error:'A video poster must be an image.'},{status:422});
  }
  const {data,error}=await c.supabase.from('ad_creatives').insert({...creative,media_id,poster_media_id:poster_media_id||null}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  await c.supabase.from('audit_log').insert({actor_id:c.user.id,action:'ad_creative.create',entity_type:'ad_creative',entity_id:data.id,metadata:{campaign_id:data.campaign_id,media_id}});
  return NextResponse.json({creative:data},{status:201});
}
