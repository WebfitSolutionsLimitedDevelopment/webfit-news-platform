'use client';

import {useMemo,useState} from 'react';
import type {NzAlert,VolcanoStatus} from '@/lib/nz-alerts';
import styles from './NzAlerts.module.css';

type Props={
  earthquakes:NzAlert[];
  weather:NzAlert[];
  emergency:NzAlert[];
  volcanoes:VolcanoStatus[];
  sourceState:{earthquakes:boolean;weather:boolean;emergency:boolean;volcanoes:boolean};
};

export default function AlertExplorer({earthquakes,weather,emergency,volcanoes,sourceState}:Props){
  const [filter,setFilter]=useState<'all'|'earthquake'|'weather'|'emergency'>('all');
  const alerts=useMemo(()=>[...emergency,...weather,...earthquakes].sort((a,b)=>new Date(b.time||0).getTime()-new Date(a.time||0).getTime()),[earthquakes,weather,emergency]);
  const shown=filter==='all'?alerts:alerts.filter(item=>item.kind===filter);
  const label=(kind:NzAlert['kind'])=>kind==='earthquake'?'Earthquake':kind==='weather'?'Severe weather':'Civil Defence';
  return <div className={styles.dashboard}>
    <div className={styles.statusGrid}>
      <div><span className={sourceState.emergency?styles.live:styles.down}></span><strong>NEMA</strong><small>{sourceState.emergency?'Live feed':'Unavailable'}</small></div>
      <div><span className={sourceState.weather?styles.live:styles.down}></span><strong>MetService</strong><small>{sourceState.weather?'Live feed':'Unavailable'}</small></div>
      <div><span className={sourceState.earthquakes?styles.live:styles.down}></span><strong>GeoNet quakes</strong><small>{sourceState.earthquakes?'Live API':'Unavailable'}</small></div>
      <div><span className={sourceState.volcanoes?styles.live:styles.down}></span><strong>GeoNet volcanoes</strong><small>{sourceState.volcanoes?'Live API':'Unavailable'}</small></div>
    </div>

    <section className={styles.volcanoPanel}>
      <div className={styles.panelTitle}><div><span>Volcanic activity</span><h2>Current NZ volcanic alert levels</h2></div><small>Official GeoNet status</small></div>
      {volcanoes.length?<div className={styles.volcanoGrid}>{volcanoes.map(v=><article key={v.id} className={v.level>0?styles.volcanoActive:styles.volcanoCard}>
        <div className={styles.level}>VAL {v.level}</div><h3>{v.title}</h3>{v.activity&&<p>{v.activity}</p>}{v.aviationCode&&<small>Aviation colour: {v.aviationCode}</small>}
      </article>)}</div>:<p className={styles.empty}>Volcanic alert data is temporarily unavailable. Check GeoNet directly before relying on this dashboard.</p>}
    </section>

    <section className={styles.alertPanel}>
      <div className={styles.panelTitle}><div><span>Live alerts</span><h2>Latest safety information</h2></div><div className={styles.filters} role="group" aria-label="Alert type">
        {([['all','All'],['emergency','Civil Defence'],['weather','Weather'],['earthquake','Earthquakes']] as const).map(([value,name])=><button key={value} type="button" onClick={()=>setFilter(value)} className={filter===value?styles.active:''}>{name}</button>)}
      </div></div>
      {shown.length?<div className={styles.alertList}>{shown.map(item=><article key={item.id} className={styles.alertCard}>
        <div className={styles.alertMeta}><span className={styles[item.kind]}>{label(item.kind)}</span>{item.severity&&<strong>{item.severity}</strong>}{item.time&&<time>{new Date(item.time).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'})}</time>}</div>
        <h3>{item.title}</h3><p>{item.detail}</p><a href={item.url} target="_blank" rel="noopener noreferrer">Open official source ↗</a>
      </article>)}</div>:<p className={styles.empty}>No items are currently loaded for this filter. This is not an “all clear”. Check the official source links below for the latest authoritative information.</p>}
    </section>
  </div>;
}
