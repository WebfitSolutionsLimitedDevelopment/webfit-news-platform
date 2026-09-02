'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImageForUpload, formatUploadSize } from '../../lib/client-image-compression';

export default function MediaUploader(){
  const ref=useRef<HTMLInputElement>(null);
  const router=useRouter();
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState('');

  async function upload(){
    const file=ref.current?.files?.[0];
    if(!file){setMsg('Choose a file first.');return}
    setBusy(true);
    setMsg('');
    try{
      let uploadFile=file;
      if(file.type.startsWith('image/')){
        setMsg(`Compressing ${file.name}...`);
        uploadFile=await compressImageForUpload(file);
        setMsg(`Compressed to ${formatUploadSize(uploadFile.size)}. Uploading...`);
      }
      const fd=new FormData();
      fd.set('file',uploadFile);
      fd.set('alt_text',file.name.replace(/\.[^.]+$/,''));
      const r=await fetch('/api/admin/media',{method:'POST',body:fd});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Upload failed');
      setMsg(file.type.startsWith('image/')?`Uploaded (${formatUploadSize(uploadFile.size)}).`:'Uploaded.');
      if(ref.current)ref.current.value='';
      router.refresh();
    }catch(e:any){setMsg(e.message)}finally{setBusy(false)}
  }

  return <div className="media-uploader"><input ref={ref} type="file" accept="image/*,.pdf"/><button className="admin-primary" disabled={busy} onClick={upload}>{busy?'Uploading...':'Upload media'}</button>{msg&&<span>{msg}</span>}</div>
}
