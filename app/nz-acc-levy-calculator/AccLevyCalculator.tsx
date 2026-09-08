'use client';
import {useMemo,useState} from 'react';
import styles from './AccLevyCalculator.module.css';

type LevyYear='2026/27'|'2027/28';
const settings:Record<LevyYear,{rate:number,maxEarnings:number,maxLevy:number}>={
  '2026/27':{rate:0.0175,maxEarnings:156641,maxLevy:2741.22},
  '2027/28':{rate:0.0183,maxEarnings:160244,maxLevy:2932.47},
};

export default function AccLevyCalculator(){
  const [year,setYear]=useState<LevyYear>('2026/27');
  const [income,setIncome]=useState(75000);
  const result=useMemo(()=>{
    const s=settings[year];
    const liable=Math.min(Math.max(0,income),s.maxEarnings);
    const levy=Math.min(s.maxLevy,liable*s.rate);
    return {s,liable,levy,weekly:levy/52,fortnightly:levy/26,monthly:levy/12};
  },[year,income]);
  const money=(n:number)=>new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:2}).format(n);
  return <div className={styles.wrap}>
    <div className={styles.fields}>
      <label>Tax year<select value={year} onChange={e=>setYear(e.target.value as LevyYear)}><option value="2026/27">2026/27 — current</option><option value="2027/28">2027/28 — next confirmed rate</option></select></label>
      <label>Annual salary or wages<input type="number" min="0" value={income} onChange={e=>setIncome(Number(e.target.value))}/></label>
    </div>
    <div className={styles.result}><span>Estimated annual ACC earners’ levy</span><strong>{money(result.levy)}</strong><small>{(result.s.rate*100).toFixed(2)}% on liable earnings up to {money(result.s.maxEarnings)}.</small></div>
    <div className={styles.breakdown}><div><span>Liable earnings used</span><strong>{money(result.liable)}</strong></div><div><span>Weekly equivalent</span><strong>{money(result.weekly)}</strong></div><div><span>Fortnightly equivalent</span><strong>{money(result.fortnightly)}</strong></div><div><span>Monthly equivalent</span><strong>{money(result.monthly)}</strong></div></div>
    <p className={styles.note}>This estimates the employee Earners’ levy only. Actual payroll deductions can vary by pay period, secondary income and payroll rounding. Self-employed ACC invoices can also include classification-based Work and Working Safer levies.</p>
  </div>;
}
