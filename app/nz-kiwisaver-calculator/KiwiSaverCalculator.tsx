'use client';

import {useMemo,useState} from 'react';
import styles from './KiwiSaverCalculator.module.css';

const rates=[3,3.5,4,6,8,10];
function money(n:number){return new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:2}).format(n||0);}
function esctRate(income:number){if(income<=18720)return .105;if(income<=64200)return .175;if(income<=93720)return .30;if(income<=216000)return .33;return .39;}

export default function KiwiSaverCalculator(){
  const [salary,setSalary]=useState(75000);
  const [employeeRate,setEmployeeRate]=useState(3.5);
  const [employerRate,setEmployerRate]=useState(3.5);
  const [includeGovernment,setIncludeGovernment]=useState(true);
  const result=useMemo(()=>{
    const gross=Math.max(0,salary);
    const employee=gross*(employeeRate/100);
    const employerGross=gross*(employerRate/100);
    const esct=employerGross*esctRate(gross+employerGross);
    const employerNet=employerGross-esct;
    const government=includeGovernment&&gross<=180000?Math.min(employee*.25,260.72):0;
    return {employee,employerGross,esct,employerNet,government,total:employee+employerNet+government,rate:esctRate(gross+employerGross)*100};
  },[salary,employeeRate,employerRate,includeGovernment]);

  return <div className={styles.grid}>
    <div className={styles.formCard}>
      <label>Annual gross salary<input type="number" min="0" step="1000" value={salary} onChange={e=>setSalary(Number(e.target.value)||0)}/></label>
      <label>Employee contribution rate<select value={employeeRate} onChange={e=>setEmployeeRate(Number(e.target.value))}>{rates.map(r=><option key={r} value={r}>{r}%{r===3?' temporary reduction':''}{r===3.5?' current default':''}</option>)}</select></label>
      <label>Employer contribution rate<select value={employerRate} onChange={e=>setEmployerRate(Number(e.target.value))}>{rates.filter(r=>r>=3).map(r=><option key={r} value={r}>{r}%</option>)}</select></label>
      <label className={styles.check}><input type="checkbox" checked={includeGovernment} onChange={e=>setIncludeGovernment(e.target.checked)}/>Include estimated government contribution where eligible</label>
      <p className={styles.note}>This assumes employer contributions are taxed using the standard ESCT method and that your employer contribution is additional to salary. Total-remuneration arrangements can differ.</p>
    </div>
    <div className={styles.resultCard}>
      <span>Estimated annual KiwiSaver going into your account</span><strong>{money(result.total)}</strong>
      <dl>
        <div><dt>Your contributions</dt><dd>{money(result.employee)}</dd></div>
        <div><dt>Employer contribution before ESCT</dt><dd>{money(result.employerGross)}</dd></div>
        <div><dt>Estimated ESCT ({result.rate.toFixed(1)}%)</dt><dd>− {money(result.esct)}</dd></div>
        <div><dt>Net employer contribution</dt><dd>{money(result.employerNet)}</dd></div>
        <div><dt>Estimated government contribution</dt><dd>{money(result.government)}</dd></div>
      </dl>
      <small>Government contribution estimate uses the current 25¢ per $1 contribution rule, capped at $260.72, and excludes people above the $180,000 taxable-income limit.</small>
    </div>
  </div>;
}
