'use client';

import {useMemo,useState} from 'react';
import styles from './HolidayPayCalculator.module.css';

const money=(n:number)=>new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);

export default function HolidayPayCalculator(){
  const [ordinaryWeeklyPay,setOrdinaryWeeklyPay]=useState('1200');
  const [gross12Months,setGross12Months]=useState('62400');
  const [weeksLeave,setWeeksLeave]=useState('1');
  const [publicHolidayHours,setPublicHolidayHours]=useState('8');
  const [hourlyRate,setHourlyRate]=useState('30');
  const [otherwiseWorkingDay,setOtherwiseWorkingDay]=useState(true);

  const result=useMemo(()=>{
    const owp=Math.max(0,Number(ordinaryWeeklyPay)||0);
    const gross=Math.max(0,Number(gross12Months)||0);
    const leave=Math.max(0,Number(weeksLeave)||0);
    const awe=gross/52;
    const weeklyHolidayRate=Math.max(owp,awe);
    const annualHolidayPay=weeklyHolidayRate*leave;
    const hours=Math.max(0,Number(publicHolidayHours)||0);
    const rate=Math.max(0,Number(hourlyRate)||0);
    const normalPay=hours*rate;
    const minimumPublicHolidayPay=normalPay*1.5;
    return {awe,weeklyHolidayRate,annualHolidayPay,normalPay,minimumPublicHolidayPay};
  },[ordinaryWeeklyPay,gross12Months,weeksLeave,publicHolidayHours,hourlyRate]);

  return <div className={styles.wrap}>
    <section className={styles.panel}>
      <h2>Annual leave pay estimate</h2>
      <p>Under the current Holidays Act rules, annual holiday pay is generally the greater of ordinary weekly pay (OWP) or average weekly earnings (AWE).</p>
      <label>Ordinary weekly pay (NZD)<input inputMode="decimal" value={ordinaryWeeklyPay} onChange={e=>setOrdinaryWeeklyPay(e.target.value)}/></label>
      <label>Gross earnings over previous 12 months (NZD)<input inputMode="decimal" value={gross12Months} onChange={e=>setGross12Months(e.target.value)}/></label>
      <label>Weeks of annual leave being taken<input inputMode="decimal" value={weeksLeave} onChange={e=>setWeeksLeave(e.target.value)}/></label>
      <div className={styles.results}>
        <div><span>Average weekly earnings</span><strong>{money(result.awe)}</strong></div>
        <div><span>Weekly holiday-pay rate used</span><strong>{money(result.weeklyHolidayRate)}</strong></div>
        <div><span>Estimated annual leave pay</span><strong>{money(result.annualHolidayPay)}</strong></div>
      </div>
    </section>

    <section className={styles.panel}>
      <h2>Public holiday work estimate</h2>
      <p>If you work on a public holiday, the minimum is generally time-and-a-half for the time actually worked. If it is an otherwise working day, an alternative holiday is usually due as well.</p>
      <label>Hours worked on public holiday<input inputMode="decimal" value={publicHolidayHours} onChange={e=>setPublicHolidayHours(e.target.value)}/></label>
      <label>Relevant hourly rate (NZD)<input inputMode="decimal" value={hourlyRate} onChange={e=>setHourlyRate(e.target.value)}/></label>
      <label className={styles.check}><input type="checkbox" checked={otherwiseWorkingDay} onChange={e=>setOtherwiseWorkingDay(e.target.checked)}/> This is a day I would otherwise have worked</label>
      <div className={styles.results}>
        <div><span>Normal pay for those hours</span><strong>{money(result.normalPay)}</strong></div>
        <div><span>Minimum public-holiday pay</span><strong>{money(result.minimumPublicHolidayPay)}</strong></div>
        <div><span>Alternative holiday</span><strong>{otherwiseWorkingDay?'Usually yes':'Usually no'}</strong></div>
      </div>
    </section>
  </div>;
}
