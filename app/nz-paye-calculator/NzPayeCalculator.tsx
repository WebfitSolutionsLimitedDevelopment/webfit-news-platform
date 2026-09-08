'use client';

import {useMemo,useState} from 'react';
import styles from './NzPayeCalculator.module.css';

const brackets=[
  {upTo:15600,rate:0.105},
  {upTo:53500,rate:0.175},
  {upTo:78100,rate:0.30},
  {upTo:180000,rate:0.33},
  {upTo:Infinity,rate:0.39},
];

function annualIncomeTax(income:number){
  let tax=0;
  let lower=0;
  for(const bracket of brackets){
    const taxable=Math.max(0,Math.min(income,bracket.upTo)-lower);
    tax+=taxable*bracket.rate;
    if(income<=bracket.upTo)break;
    lower=bracket.upTo;
  }
  return tax;
}

const frequencies={weekly:52,fortnightly:26,monthly:12,annual:1} as const;
type Frequency=keyof typeof frequencies;

const money=(n:number)=>new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:2}).format(n);

export function NzPayeCalculator(){
  const [annualSalary,setAnnualSalary]=useState(75000);
  const [frequency,setFrequency]=useState<Frequency>('fortnightly');
  const [kiwiSaver,setKiwiSaver]=useState(3.5);
  const [studentLoan,setStudentLoan]=useState(false);

  const result=useMemo(()=>{
    const gross=Math.max(0,Number(annualSalary)||0);
    const incomeTax=annualIncomeTax(gross);
    const acc=Math.min(gross,156641)*0.0175;
    const ks=gross*(kiwiSaver/100);
    const loan=studentLoan?Math.max(0,gross-24128)*0.12:0;
    const deductions=incomeTax+acc+ks+loan;
    const net=Math.max(0,gross-deductions);
    const periods=frequencies[frequency];
    return {gross,incomeTax,acc,ks,loan,deductions,net,periods,effective:gross?((incomeTax+acc)/gross)*100:0};
  },[annualSalary,frequency,kiwiSaver,studentLoan]);

  return <div className={styles.calculator}>
    <div className={styles.inputs}>
      <label><span>Annual gross salary</span><div className={styles.moneyInput}><span>$</span><input type="number" min="0" step="1000" value={annualSalary} onChange={e=>setAnnualSalary(Number(e.target.value))}/></div></label>
      <label><span>Show take-home as</span><select value={frequency} onChange={e=>setFrequency(e.target.value as Frequency)}><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label>
      <label><span>Employee KiwiSaver contribution</span><select value={kiwiSaver} onChange={e=>setKiwiSaver(Number(e.target.value))}><option value={0}>Not contributing</option><option value={3}>3% temporary reduced rate</option><option value={3.5}>3.5% default</option><option value={4}>4%</option><option value={6}>6%</option><option value={8}>8%</option><option value={10}>10%</option></select></label>
      <label className={styles.check}><input type="checkbox" checked={studentLoan} onChange={e=>setStudentLoan(e.target.checked)}/><span>Include NZ student-loan repayment estimate</span></label>
    </div>

    <div className={styles.results}>
      <div className={styles.net}><span>Estimated take-home</span><strong>{money(result.net/result.periods)}</strong><small>per {frequency==='annual'?'year':frequency.replace('ly','')}</small></div>
      <div className={styles.breakdown}>
        <div><span>Gross income</span><strong>{money(result.gross)}</strong></div>
        <div><span>Income tax</span><strong>− {money(result.incomeTax)}</strong></div>
        <div><span>ACC earners’ levy</span><strong>− {money(result.acc)}</strong></div>
        {kiwiSaver>0?<div><span>KiwiSaver ({kiwiSaver}%)</span><strong>− {money(result.ks)}</strong></div>:null}
        {studentLoan?<div><span>Student loan</span><strong>− {money(result.loan)}</strong></div>:null}
        <div className={styles.total}><span>Estimated annual take-home</span><strong>{money(result.net)}</strong></div>
      </div>
      <p className={styles.note}>Estimated effective income tax + ACC rate: <strong>{result.effective.toFixed(1)}%</strong>. This is a general annual estimate, not payroll-exact PAYE.</p>
    </div>
  </div>;
}
