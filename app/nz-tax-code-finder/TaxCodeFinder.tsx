'use client';

import {useMemo,useState} from 'react';
import styles from './TaxCodeFinder.module.css';
import {secondaryTaxBands} from '@/lib/nz-tax-codes';

type IncomeType='main'|'secondary';

export default function TaxCodeFinder(){
  const [incomeType,setIncomeType]=useState<IncomeType>('main');
  const [annualIncome,setAnnualIncome]=useState(65000);
  const [studentLoan,setStudentLoan]=useState(false);
  const [nzResident,setNzResident]=useState(true);
  const [ietcEligible,setIetcEligible]=useState(false);

  const result=useMemo(()=>{
    if(!nzResident)return {code:'Check IR330',note:'This finder is for common New Zealand resident salary/wage situations. Non-resident and special work categories can use different codes.'};
    if(incomeType==='main'){
      if(ietcEligible&&annualIncome>=24000&&annualIncome<=70000)return {code:studentLoan?'ME SL':'ME',note:'Main income with Independent Earner Tax Credit treatment. Confirm you meet the IETC conditions on the IR330.'};
      return {code:studentLoan?'M SL':'M',note:studentLoan?'Main income with a New Zealand student loan.':'Main or highest source of salary or wages.'};
    }
    const band=secondaryTaxBands.find(b=>annualIncome>=b.min&&annualIncome<=b.max)??secondaryTaxBands[secondaryTaxBands.length-1];
    return {code:`${band.code}${studentLoan?' SL':''}`,note:`Secondary income code based on estimated annual total income from all sources. Base secondary rate: ${band.rate}%.`};
  },[incomeType,annualIncome,studentLoan,nzResident,ietcEligible]);

  return <div className={styles.wrap}>
    <div className={styles.form}>
      <label><span>Is this your main/highest income or a secondary income?</span><select value={incomeType} onChange={e=>setIncomeType(e.target.value as IncomeType)}><option value="main">Main / highest income</option><option value="secondary">Secondary income</option></select></label>
      <label><span>Estimated annual total income from all sources</span><div className={styles.money}><span>$</span><input type="number" min="0" step="100" value={annualIncome} onChange={e=>setAnnualIncome(Number(e.target.value)||0)}/></div></label>
      <label className={styles.check}><input type="checkbox" checked={studentLoan} onChange={e=>setStudentLoan(e.target.checked)}/><span>I have a New Zealand student loan</span></label>
      <label className={styles.check}><input type="checkbox" checked={nzResident} onChange={e=>setNzResident(e.target.checked)}/><span>I am a New Zealand tax resident</span></label>
      {incomeType==='main'&&<label className={styles.check}><input type="checkbox" checked={ietcEligible} onChange={e=>setIetcEligible(e.target.checked)}/><span>I expect to qualify for the Independent Earner Tax Credit (IETC)</span></label>}
    </div>
    <aside className={styles.result} aria-live="polite"><span>Likely tax code</span><strong>{result.code}</strong><p>{result.note}</p><small>Use this as a guide only. Your final code should follow IRD's IR330 declaration or tailored tax-code instructions.</small></aside>
  </div>;
}
