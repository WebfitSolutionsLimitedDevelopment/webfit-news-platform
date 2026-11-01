'use client';

import { useRef, useState } from 'react';
import styles from './SportsMedia.module.css';

type Video = { id:string; title:string; youtubeId:string; date:string };
type Photo = { id:string; title:string; image:string; alt:string; slug:string; date:string };

export function SportsMedia({videos,photos}:{videos:Video[];photos:Photo[]}) {
  const [selected,setSelected]=useState<Video|null>(null);
  const [floating,setFloating]=useState(false);
  const [photo,setPhoto]=useState<Photo|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  if(!videos.length&&!photos.length)return null;
  return <section className={styles.section} aria-label="Sports videos and photos">
    <h2>Watch &amp; see: sport</h2>
    <p>Recent interviews, match coverage and photos from Webfit News.</p>
    {videos.length ? <>
      <h3>Sports videos</h3>
      <p>Choose a video to watch here. Use “Float player” to keep watching while you browse this page.</p>
      {selected ? <div className={styles.playerSpace}>
        <div className={floating?styles.floating:styles.player}>
          <div className={styles.toolbar}>
            <span>{selected.title}</span>
            <button type="button" onClick={()=>setFloating(v=>!v)}>{floating?'Return to page':'Float player'}</button>
            <button type="button" aria-label="Close video" onClick={()=>{setSelected(null);setFloating(false);}}>×</button>
          </div>
          <iframe key={selected.youtubeId} src={`https://www.youtube-nocookie.com/embed/${selected.youtubeId}?playsinline=1&rel=0&autoplay=1`} title={selected.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      </div>:null}
      <div className={styles.grid}>{videos.map(v=><button type="button" className={styles.card} key={v.id} onClick={()=>setSelected(v)} aria-pressed={selected?.id===v.id}>
        <div className={styles.thumb}><img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" loading="lazy"/><span>▶ Watch here</span></div>
        <strong>{v.title}</strong><time dateTime={v.date}>{new Date(v.date).toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric',timeZone:'Pacific/Auckland'})}</time>
      </button>)}</div>
    </>:null}
    {photos.length ? <>
      <h3>Sports photos &amp; stories</h3>
      <div className={styles.grid}>{photos.map(p=><button className={styles.card} type="button" key={p.id} onClick={()=>{setPhoto(p);dialog.current?.showModal();}}>
        <img src={p.image} alt={p.alt} loading="lazy"/><strong>{p.title}</strong><span>View photo</span>
      </button>)}</div>
      <dialog ref={dialog} className={styles.dialog} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}>
        <button type="button" className={styles.close} aria-label="Close photo" onClick={()=>dialog.current?.close()}>×</button>
        {photo?<><img src={photo.image} alt={photo.alt}/><p>{photo.title}</p><a href={`/${photo.slug}`}>Read the story on Webfit News →</a></>:null}
      </dialog>
    </>:null}
  </section>;
}
