import { createClient } from '@/lib/supabase-server';

type Props={slotKey:string;className?:string};

export async function AdSlot({slotKey,className=''}:Props){
  const supabase=await createClient();
  const {data:slot}=await supabase.from('ad_slots').select('id,key,label,recommended_width,recommended_height').eq('key',slotKey).eq('is_active',true).maybeSingle();
  if(!slot)return null;
  const {data:assignment}=await supabase.from('ad_assignments')
    .select('id,creative:creative_id(id,headline,destination_url,alt_text,media:media_id(public_url,alt_text))')
    .eq('slot_id',slot.id).eq('is_active',true)
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .order('priority',{ascending:false}).limit(1).maybeSingle();
  const creative=(assignment as any)?.creative;
  const image=creative?.media?.public_url;
  if(creative&&image){
    return <aside className={`ad-zone ad-zone-live ${className}`} aria-label="Advertisement">
      <span className="ad-label">Advertisement</span>
      <a href={creative.destination_url} target="_blank" rel="sponsored noopener noreferrer">
        <img src={image} alt={creative.alt_text||creative.media?.alt_text||creative.headline||'Advertisement'}/>
      </a>
    </aside>;
  }
  return <aside className={`ad-zone ad-zone-empty ${className}`} aria-label="Advertising position">
    <span className="ad-label">Advertising</span>
    <div><strong>{slot.label}</strong><small>{slot.recommended_width||''}{slot.recommended_width&&slot.recommended_height?' × ':''}{slot.recommended_height||''}</small></div>
  </aside>;
}
