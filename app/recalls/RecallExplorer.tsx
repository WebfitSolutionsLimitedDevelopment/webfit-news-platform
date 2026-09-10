'use client';

import {useMemo,useState} from 'react';
import type {RecallItem} from '@/lib/nz-recalls';
import styles from './Recalls.module.css';

type Props={products:RecallItem[];food:RecallItem[];productOk:boolean;foodOk:boolean};

export default function RecallExplorer({products,food,productOk,foodOk}:Props){
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState<'all'|'product'|'food'>('all');
  const all=useMemo(()=>[
    ...products.map(item=>({...item,kind:'product' as const})),
    ...food.map(item=>({...item,kind:'food' as const})),
  ],[products,food]);
  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return all.filter(item=>(filter==='all'||item.kind===filter)&&(!q||`${item.title} ${item.source} ${(item.categories||[]).join(' ')}`.toLowerCase().includes(q)));
  },[all,query,filter]);

  return <div className={styles.explorer}>
    <div className={styles.searchRow}>
      <label className={styles.searchBox}>
        <span>Search current recalls</span>
        <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Brand, product, retailer or keyword" />
      </label>
      <div className={styles.filters} role="group" aria-label="Recall type">
        <button type="button" className={filter==='all'?styles.active:''} onClick={()=>setFilter('all')}>All</button>
        <button type="button" className={filter==='product'?styles.active:''} onClick={()=>setFilter('product')}>Products</button>
        <button type="button" className={filter==='food'?styles.active:''} onClick={()=>setFilter('food')}>Food</button>
      </div>
    </div>

    <div className={styles.statusRow}>
      <span className={productOk?styles.ok:styles.warn}>Product Safety NZ: {productOk?'live source loaded':'temporarily unavailable'}</span>
      <span className={foodOk?styles.ok:styles.warn}>MPI Food Safety: {foodOk?'live source loaded':'temporarily unavailable'}</span>
    </div>

    {filtered.length>0?<div className={styles.recallGrid}>{filtered.map(item=><article className={styles.recallCard} key={`${item.source}-${item.url}`}>
      <div className={styles.cardTop}><span className={item.kind==='food'?styles.foodBadge:styles.productBadge}>{item.kind==='food'?'Food recall':'Product recall'}</span>{item.date&&<time>{item.date}</time>}</div>
      <h3>{item.title}</h3>
      <p>Source: {item.source}</p>
      <a href={item.url} target="_blank" rel="noopener noreferrer">View official recall notice ↗</a>
    </article>)}</div>:<div className={styles.empty}>No currently loaded recall matches that search. This does not mean the product has never been recalled. Check the official databases below as well.</div>}
  </div>;
}
