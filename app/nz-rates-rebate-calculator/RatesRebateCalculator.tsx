'use client';
import {useMemo,useState} from 'react';
import styles from './RatesRebateCalculator.module.css';

export default function RatesRebateCalculator(){
  const [rates,setRates]=useState(4000);
  const [income,setIncome]=useState(33000);
  const [dependants,setDependants]=useState(0);
  const [superGold,setSuperGold]=useState(false);
  const result=useMemo(()=>{
    const threshold=(superGold?46400:33210)+(Math.max(0,dependants)*500);
    const base=Math.max(0,(2/3)*(Math.max(0,rates)-160));
    const abatement=Math.max(0,income-threshold)/8;
    const estimate=Math.max(0,Math.min(830,base-abatement));
    return {threshold,estimate};
  },[rates,income,dependants,superGold]);
  const money=(n:number)=>new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:2}).format(n);
  return <div className={styles.wrap}>
    <div className={styles.fields}>
      <label>Annual rates payable<input type="number" min="0" value={rates} onChange={e=>setRates(Number(e.target.value))}/></label>
      <label>Household income before tax<input type="number" min="0" value={income} onChange={e=>setIncome(Number(e.target.value))}/></label>
      <label>Dependants<input type="number" min="0" step="1" value={dependants} onChange={e=>setDependants(Math.max(0,Math.floor(Number(e.target.value))))}/></label>
      <label className={styles.check}><input type="checkbox" checked={superGold} onChange={e=>setSuperGold(e.target.checked)}/> I am a SuperGold Card cardholder</label>
    </div>
    <div className={styles.result}><span>Estimated 2026/27 rebate</span><strong>{money(result.estimate)}</strong><small>Maximum statutory rebate: $830. Income threshold used: {money(result.threshold)}.</small></div>
    <p className={styles.note}>Estimate only. Your council determines eligibility and the final rebate after assessing ownership, residence, income, rates and other statutory requirements.</p>
  </div>;
}
