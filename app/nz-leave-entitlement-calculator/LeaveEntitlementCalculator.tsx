'use client';

import { useMemo, useState } from 'react';
import styles from './LeaveEntitlementCalculator.module.css';

function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value));}

export default function LeaveEntitlementCalculator(){
  const [months,setMonths]=useState(8);
  const [regularDays,setRegularDays]=useState(5);
  const [carriedSick,setCarriedSick]=useState(0);
  const [sickUsed,setSickUsed]=useState(0);
  const [meetsHoursTest,setMeetsHoursTest]=useState(true);

  const result=useMemo(()=>{
    const sickEligible=months>=6&&meetsHoursTest;
    const newSick=sickEligible?10:0;
    const availableSick=clamp(newSick+Math.max(0,carriedSick)-Math.max(0,sickUsed),0,20);
    const annualEligible=months>=12;
    const indicativeDays=annualEligible?4*clamp(regularDays,1,7):0;
    return {sickEligible,availableSick,annualEligible,indicativeDays};
  },[months,regularDays,carriedSick,sickUsed,meetsHoursTest]);

  return <div className={styles.wrap}>
    <div className={styles.formGrid}>
      <label><span>Months with current employer</span><input type="number" min="0" max="120" value={months} onChange={e=>setMonths(Number(e.target.value)||0)}/></label>
      <label><span>Regular working days per week</span><input type="number" min="1" max="7" step="0.5" value={regularDays} onChange={e=>setRegularDays(Number(e.target.value)||1)}/></label>
      <label><span>Sick leave carried into this entitlement year</span><input type="number" min="0" max="20" step="0.5" value={carriedSick} onChange={e=>setCarriedSick(Number(e.target.value)||0)}/></label>
      <label><span>Sick leave used this entitlement year</span><input type="number" min="0" max="30" step="0.5" value={sickUsed} onChange={e=>setSickUsed(Number(e.target.value)||0)}/></label>
    </div>
    <label className={styles.check}><input type="checkbox" checked={meetsHoursTest} onChange={e=>setMeetsHoursTest(e.target.checked)}/><span>I meet the sick-leave work test (continuous employment, or average 10+ hours/week with the required weekly/monthly pattern).</span></label>

    <div className={styles.results}>
      <article><span>Sick leave eligibility</span><strong>{result.sickEligible?'Eligible':'Not yet eligible'}</strong><small>{result.sickEligible?'Minimum 10 paid days for the entitlement year.':'Usually starts after 6 months once the work test is met.'}</small></article>
      <article><span>Estimated sick leave available</span><strong>{result.availableSick.toFixed(1)} days</strong><small>Includes entered carry-over and days already used; statutory accumulation is capped at 20 days unless better terms apply.</small></article>
      <article><span>Annual holiday entitlement</span><strong>{result.annualEligible?'4 weeks':'Not yet entitled'}</strong><small>{result.annualEligible?`For a regular ${regularDays}-day week, 4 weeks is roughly ${result.indicativeDays.toFixed(1)} working days.`:'The statutory four-week entitlement generally arises after 12 months.'}</small></article>
    </div>

    <div className={styles.note}><strong>Important:</strong> Annual holidays are legally expressed in weeks, not a fixed monthly accrual. For variable work patterns, the actual number of days or hours representing a week must reflect the employee’s genuine working week.</div>
  </div>;
}
