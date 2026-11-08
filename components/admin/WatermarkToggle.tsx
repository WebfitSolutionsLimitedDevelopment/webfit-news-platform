'use client';
import { useEffect, useState } from 'react';
import { setWatermarkOn, watermarkOn } from '../../lib/watermark-pref';

/** Checkbox shown beside newsroom uploaders. Untick for supplied or third-party photos. */
export default function WatermarkToggle(){
  const[on,setOn]=useState(true);
  useEffect(()=>{setOn(watermarkOn())},[]);
  return <label style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13}} title="Untick for photos supplied by other organisations or photographers">
    <input type="checkbox" checked={on} onChange={e=>{setOn(e.target.checked);setWatermarkOn(e.target.checked)}}/>
    Add Webfit News logo
  </label>;
}
