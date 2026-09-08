'use client';

import {useMemo,useState} from 'react';
import styles from './StudentLoanCalculator.module.css';

const thresholds={weekly:464,fortnightly:928,threeWeekly:1392,fourWeekly:1856,monthly:2010.66};
const periodsPerYear={weekly:52,fortnightly:26,threeWeekly:52/3,fourWeekly:13,monthly:12};
type Frequency=keyof typeof thresholds;

function money(v:number){return new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:2}).format(v||0);}

export default function StudentLoanCalculator(){
  const [frequency,setFrequency]=useState<Frequency>('fortnightly');
  const [gross,setGross]=useState(2500);
  const [secondary,setSecondary]=useState(false);
  const [extra,setExtra]=useState(0);
  const [balance,setBalance]=useState(30000);

  const result=useMemo(()=>{
    const base=secondary?gross:Math.max(0,gross-thresholds[frequency]);
    const required=base*0.12;
    const total=Math.min(Math.max(0,balance),required+Math.max(0,extra));
    const annualRequired=required*periodsPerYear[frequency];
    const annualTotal=total*periodsPerYear[frequency];
    const years=annualTotal>0?balance/annualTotal:Infinity;
    return {required,total,annualRequired,annualTotal,years};
  },[frequency,gross,secondary,extra,balance]);

  return <div className={styles.wrap}>
    <div className={styles.inputs}>
      <label>Pay frequency<select value={frequency} onChange={e=>setFrequency(e.target.value as Frequency)}><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="threeWeekly">Every 3 weeks</option><option value="fourWeekly">Every 4 weeks</option><option value="monthly">Monthly</option></select></label>
      <label>Gross pay for this period<input type="number" min="0" value={gross} onChange={e=>setGross(Number(e.target.value)||0)}/></label>
      <label>Current loan balance<input type="number" min="0" value={balance} onChange={e=>setBalance(Number(e.target.value)||0)}/></label>
      <label>Extra repayment per pay period<input type="number" min="0" value={extra} onChange={e=>setExtra(Number(e.target.value)||0)}/></label>
      <label className={styles.check}><input type="checkbox" checked={secondary} onChange={e=>setSecondary(e.target.checked)}/> This is a secondary job</label>
    </div>
    <div className={styles.results}>
      <article><span>Required deduction</span><strong>{money(result.required)}</strong><small>{secondary?'12% of all secondary-job gross pay':'12% of pay above the period threshold'}</small></article>
      <article><span>Total with extra repayment</span><strong>{money(result.total)}</strong><small>Per pay period, capped by the balance entered.</small></article>
      <article><span>Estimated required repayments/year</span><strong>{money(result.annualRequired)}</strong><small>Assumes the same gross pay each period.</small></article>
      <article><span>Estimated payoff time</span><strong>{Number.isFinite(result.years)?`${result.years.toFixed(1)} years`:'—'}</strong><small>Simple estimate only; future earnings and loan adjustments can change this.</small></article>
    </div>
    {!secondary&&<p className={styles.note}>Current threshold for this pay frequency: <strong>{money(thresholds[frequency])}</strong>. The annual threshold is $24,128.</p>}
  </div>;
}
