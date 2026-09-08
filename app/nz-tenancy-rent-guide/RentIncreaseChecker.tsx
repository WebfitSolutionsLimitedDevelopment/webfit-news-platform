'use client';

import {useMemo,useState} from 'react';
import styles from './RentIncreaseChecker.module.css';

type TenancyType='periodic'|'fixed';

function daysBetween(a:string,b:string){
  const start=new Date(`${a}T00:00:00`);
  const end=new Date(`${b}T00:00:00`);
  return Math.floor((end.getTime()-start.getTime())/86400000);
}

export default function RentIncreaseChecker(){
  const [type,setType]=useState<TenancyType>('periodic');
  const [tenancyStart,setTenancyStart]=useState('');
  const [lastIncrease,setLastIncrease]=useState('');
  const [noticeDate,setNoticeDate]=useState('');
  const [effectiveDate,setEffectiveDate]=useState('');
  const [fixedAllows,setFixedAllows]=useState(false);

  const result=useMemo(()=>{
    if(!tenancyStart||!noticeDate||!effectiveDate)return null;
    const base=lastIncrease||tenancyStart;
    const interval=daysBetween(base,effectiveDate);
    const notice=daysBetween(noticeDate,effectiveDate);
    const twelveMonths=new Date(`${base}T00:00:00`); twelveMonths.setFullYear(twelveMonths.getFullYear()+1);
    const effective=new Date(`${effectiveDate}T00:00:00`);
    const timingOk=effective>=twelveMonths;
    const noticeOk=notice>=60;
    const fixedOk=type==='periodic'||fixedAllows;
    const ok=timingOk&&noticeOk&&fixedOk;
    const reasons:string[]=[];
    if(!timingOk)reasons.push('The proposed effective date is less than 12 months after the tenancy started or the last rent increase took effect.');
    if(!noticeOk)reasons.push(`The notice period is ${notice} days; a standard residential tenancy normally needs at least 60 days’ written notice.`);
    if(!fixedOk)reasons.push('For a fixed-term tenancy, the agreement must permit a rent increase during the fixed term.');
    return {ok,reasons,interval,notice};
  },[type,tenancyStart,lastIncrease,noticeDate,effectiveDate,fixedAllows]);

  return <div className={styles.wrap}>
    <div className={styles.grid}>
      <label>Tenancy type<select value={type} onChange={e=>setType(e.target.value as TenancyType)}><option value="periodic">Periodic</option><option value="fixed">Fixed term</option></select></label>
      <label>Tenancy start date<input type="date" value={tenancyStart} onChange={e=>setTenancyStart(e.target.value)}/></label>
      <label>Last rent increase effective date <span>(leave blank if none)</span><input type="date" value={lastIncrease} onChange={e=>setLastIncrease(e.target.value)}/></label>
      <label>Date written notice is given<input type="date" value={noticeDate} onChange={e=>setNoticeDate(e.target.value)}/></label>
      <label>Proposed new-rent effective date<input type="date" value={effectiveDate} onChange={e=>setEffectiveDate(e.target.value)}/></label>
      {type==='fixed'&&<label className={styles.check}><input type="checkbox" checked={fixedAllows} onChange={e=>setFixedAllows(e.target.checked)}/>The fixed-term agreement permits a rent increase during the term.</label>}
    </div>
    <div className={styles.result}>
      {!result?<><strong>Enter the dates to check the standard timing rules.</strong><p>This is a guide for ordinary residential tenancies, not boarding houses or special agreed increases after substantial improvements.</p></>:<><strong>{result.ok?'The timing appears to meet the standard rules':'The proposed increase may not meet the standard rules'}</strong><p>{result.ok?`The effective date is at least 12 months from the relevant start/last-increase date and you have allowed ${result.notice} days’ notice.`:result.reasons.join(' ')}</p></>}
    </div>
  </div>;
}
