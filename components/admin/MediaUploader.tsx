'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImageForUpload, formatUploadSize } from '../../lib/client-image-compression';
import { uploadVideoResumable } from '../../lib/tus-video-upload';

const VIDEO_LIMIT=140*1024*1024;

export default function MediaUploader(){
  const ref=useRef<HTMLInputElement>(null);
  const router=useRouter();
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState('');

  async function upload(){
    const file=ref.current?.files?.[0];
    if(!file){setMsg('Choose a file first.');return}
    if(file.type.startsWith('video/')&&file.size>VIDEO_LIMIT){setMsg('Video must be 140 MB or smaller. Compress longer videos before uploading.');return}
    setBusy(true);
    setMsg('');
    try{
      if(file.type.startsWith('video/')){
        const path=await uploadVideoResumable(file,percent=>setMsg('Uploading video: '+percent+'%'));
        setMsg('Saving video to the Media Library...');
        const response=await fetch('/api/admin/media/video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,filename:file.name,mime_type:file.type,file_size:file.size,alt_text:file.name.replace(/\.[^.]+$/,'')})});
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(result.error||'The video uploaded but could not be added to the Media Library.');
        setMsg('Video uploaded ('+formatUploadSize(file.size)+').');
      }else{
        let uploadFile=file;
        if(file.type.startsWith('image/')){
          setMsg('Compressing '+file.name+'...');
          uploadFile=await compressImageForUpload(file);
          setMsg('Compressed to '+formatUploadSize(uploadFile.size)+'. Uploading...');
        }
        const form=new FormData();
        form.set('file',uploadFile);
        form.set('alt_text',file.name.replace(/\.[^.]+$/,''));
        const response=await fetch('/api/admin/media',{method:'POST',body:form});
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(result.error||'Upload failed');
        setMsg(file.type.startsWith('image/')?'Image uploaded ('+formatUploadSize(uploadFile.size)+').':'File uploaded.');
      }
      if(ref.current)ref.current.value='';
      router.refresh();
    }catch(error){
      setMsg(error instanceof Error?error.message:'Upload failed. Please retry.');
    }finally{
      setBusy(false);
    }
  }

  return <div className="media-uploader">
    <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/quicktime,application/pdf" disabled={busy}/>
    <button className="admin-primary" disabled={busy} onClick={upload}>{busy?'Uploading...':'Upload media'}</button>
    <span>Images, PDFs, MP4 or MOV. Video limit: 140 MB.</span>
    {msg?<span role="status">{msg}</span>:null}
  </div>;
}
