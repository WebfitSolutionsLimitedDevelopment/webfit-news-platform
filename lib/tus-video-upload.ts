'use client';

import { createClient } from './supabase-browser';
import { getPublicEnv } from './env';

const VIDEO_LIMIT=140*1024*1024;
const CHUNK_SIZE=6*1024*1024;

function base64(value:string){
  return btoa(value);
}

function safeUploadUrl(location:string,endpoint:string){
  const url=new URL(location,endpoint);
  const origin=new URL(endpoint).origin;
  if(url.protocol!=='https:'||url.origin!==origin)throw new Error('Storage returned an unexpected upload address.');
  return url.toString();
}

export async function uploadVideoResumable(file:File,onProgress:(percent:number)=>void){
  if(!['video/mp4','video/quicktime'].includes(file.type))throw new Error('Choose an MP4 or MOV video.');
  if(file.size>VIDEO_LIMIT)throw new Error('Video must be 140 MB or smaller. Compress longer videos before uploading.');

  const supabase=createClient();
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('Your newsroom session has expired. Sign in again and retry.');

  const {supabaseUrl,supabasePublishableKey}=getPublicEnv();
  const apiUrl=new URL(supabaseUrl);
  if(apiUrl.hostname.endsWith('.supabase.co'))apiUrl.hostname=apiUrl.hostname.replace('.supabase.co','.storage.supabase.co');
  const endpoint=apiUrl.origin+'/storage/v1/upload/resumable';
  const safeName=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-')||'video.mp4';
  const path=session.user.id+'/videos/'+crypto.randomUUID()+'-'+safeName;
  const authHeaders={
    apikey:supabasePublishableKey,
    Authorization:'Bearer '+session.access_token,
    'Tus-Resumable':'1.0.0'
  };
  const metadata=[
    'bucketName '+base64('news-media'),
    'objectName '+base64(path),
    'contentType '+base64(file.type),
    'cacheControl '+base64('31536000')
  ].join(',');

  const created=await fetch(endpoint,{method:'POST',headers:{...authHeaders,'Upload-Length':String(file.size),'Upload-Metadata':metadata}});
  if(created.status!==201){
    const detail=(await created.text().catch(()=>'' )).slice(0,240);
    throw new Error('Could not start video upload (HTTP '+created.status+'). '+detail);
  }
  const location=created.headers.get('Location');
  if(!location)throw new Error('Storage did not return an upload address.');
  const uploadUrl=safeUploadUrl(location,endpoint);

  async function readOffset(){
    const response=await fetch(uploadUrl,{method:'HEAD',headers:authHeaders});
    if(!response.ok)throw new Error('Could not resume video upload (HTTP '+response.status+').');
    return Number(response.headers.get('Upload-Offset')||0);
  }

  let offset=0;
  while(offset<file.size){
    const end=Math.min(offset+CHUNK_SIZE,file.size);
    let response:Response|undefined;
    let lastError:unknown;
    for(let attempt=0;attempt<3;attempt++){
      try{
        response=await fetch(uploadUrl,{method:'PATCH',headers:{...authHeaders,'Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'},body:file.slice(offset,end)});
        if(response.ok){
          const next=Number(response.headers.get('Upload-Offset'));
          if(!Number.isFinite(next)||next<=offset||next>file.size)throw new Error('Storage returned an invalid upload position.');
          offset=next;
          lastError=undefined;
          break;
        }
        if(response.status!==409&&response.status<500){
          const detail=(await response.text().catch(()=>'' )).slice(0,240);
          throw new Error('Video upload failed (HTTP '+response.status+'). '+detail);
        }
        offset=await readOffset();
      }catch(error){
        lastError=error;
        if(error instanceof Error&&/Video upload failed|invalid upload position/.test(error.message))throw error;
        if(attempt<2)offset=await readOffset();
      }
    }
    if(lastError)throw lastError;
    onProgress(Math.min(100,Math.round(offset/file.size*100)));
  }
  return path;
}
