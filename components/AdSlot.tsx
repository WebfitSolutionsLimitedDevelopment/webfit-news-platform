import { createClient } from '@/lib/supabase-server';
import { MobileStickyAd } from '@/components/MobileStickyAd';

type Props={slotKey:string;className?:string};

export async function AdSlot({slotKey,className=''}:Props){
  const supabase=await createClient();
  const {data:creative,error}=await supabase.from('public_ad_placements').select('assignment_id,slot_key,headline,destination_url,creative_alt_text,media_url,media_mime_type,media_alt_text,poster_url,media_width,media_height,priority').eq('slot_key',slotKey).order('priority',{ascending:false}).limit(1).maybeSingle();
  if(error){
    console.error('Unable to load ad placement',slotKey,error.message);
    return null;
  }
  if(!creative?.media_url)return null;

  const isImage=String(creative.media_mime_type||'').startsWith('image/');
  const isVideo=String(creative.media_mime_type||'').startsWith('video/');
  if(!isImage&&!isVideo)return null;
  if(slotKey==='MOBILE_STICKY'&&!isImage)return null;

  const media=isImage
    ? <a className="ad-media-link" href={creative.destination_url} target="_blank" rel="sponsored noopener noreferrer">
        <img src={creative.media_url} alt={creative.creative_alt_text||creative.media_alt_text||creative.headline||'Advertisement'} loading="lazy" decoding="async"/>
      </a>
    : <video src={creative.media_url} controls muted playsInline preload="none" poster={creative.poster_url||undefined} aria-label={creative.headline||'Sponsored video advertisement'}/>;

  const ad=<aside className={'ad-zone ad-zone-live '+className} aria-label="Advertisement">
    <span className="ad-label">Advertisement</span>
    {media}
    {isVideo?<a className="ad-cta" href={creative.destination_url} target="_blank" rel="sponsored noopener noreferrer">{creative.headline||'Learn more'}</a>:null}
  </aside>;

  return slotKey==='MOBILE_STICKY'?<MobileStickyAd>{ad}</MobileStickyAd>:ad;
}
