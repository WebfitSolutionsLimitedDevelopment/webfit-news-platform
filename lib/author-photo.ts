'use client';

/** Centre-crop to a square and shrink to 400×400, so every byline photo is small, sharp and round-ready. */
export async function squarePhoto(file:File):Promise<Blob>{
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise<HTMLImageElement>((ok,fail)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>fail(new Error('That file is not a photo we can read. Try a JPG or PNG.'));i.src=url});
    const side=Math.min(img.naturalWidth,img.naturalHeight);
    // Portraits: keep the face, which is usually in the upper part of the picture.
    const sx=(img.naturalWidth-side)/2;
    const sy=img.naturalHeight>img.naturalWidth?Math.max(0,(img.naturalHeight-side)*0.2):(img.naturalHeight-side)/2;
    const canvas=document.createElement('canvas');canvas.width=400;canvas.height=400;
    const g=canvas.getContext('2d')!;g.imageSmoothingQuality='high';g.drawImage(img,sx,sy,side,side,0,0,400,400);
    return await new Promise<Blob>((ok,fail)=>canvas.toBlob(b=>b?ok(b):fail(new Error('Could not prepare the photo.')),'image/jpeg',0.86));
  }finally{URL.revokeObjectURL(url)}
}


/** Crop, upload to the media library and return the public link. */
export async function uploadAuthorPhoto(file:File,slug:string,alt:string):Promise<string>{
  const blob=await squarePhoto(file);
  const form=new FormData();
  form.append('file',new File([blob],`author-${slug}.jpg`,{type:'image/jpeg'}));
  form.append('alt_text',alt);
  const r=await fetch('/api/admin/media',{method:'POST',body:form});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.media?.public_url)throw new Error(typeof d.error==='string'?d.error:'Upload failed. Try again.');
  return d.media.public_url;
}
