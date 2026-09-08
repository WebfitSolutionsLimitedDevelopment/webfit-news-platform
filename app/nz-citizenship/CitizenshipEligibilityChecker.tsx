'use client';

import {useMemo,useState} from 'react';
import styles from './CitizenshipEligibilityChecker.module.css';

export default function CitizenshipEligibilityChecker(){
  const [indefinite,setIndefinite]=useState(true);
  const [totalDays,setTotalDays]=useState(1350);
  const [yearDays,setYearDays]=useState([240,240,240,240,240]);
  const [english,setEnglish]=useState(true);
  const [character,setCharacter]=useState(true);
  const [intendNz,setIntendNz]=useState(true);

  const result=useMemo(()=>{
    const presenceTotal=totalDays>=1350;
    const eachYear=yearDays.every(v=>v>=240);
    const core=indefinite&&presenceTotal&&eachYear&&english&&character&&intendNz;
    const gaps=[];
    if(!indefinite)gaps.push('You need status that allows you to be in New Zealand indefinitely.');
    if(!presenceTotal)gaps.push('You have entered fewer than 1,350 eligible presence days across the last 5 years.');
    if(!eachYear)gaps.push('At least one 12-month period is below the 240-day minimum.');
    if(!english)gaps.push('Adults generally need enough English for everyday situations.');
    if(!character)gaps.push('Character issues can require individual assessment by the Citizenship Office.');
    if(!intendNz)gaps.push('Applicants generally need to intend to continue living in New Zealand, subject to limited statutory exceptions.');
    return {core,gaps};
  },[indefinite,totalDays,yearDays,english,character,intendNz]);

  function setYear(index:number,value:number){
    setYearDays(prev=>prev.map((v,i)=>i===index?value:v));
  }

  return <div className={styles.wrap}>
    <div className={styles.form}>
      <label className={styles.check}><input type="checkbox" checked={indefinite} onChange={e=>setIndefinite(e.target.checked)}/> I have status that lets me live in New Zealand indefinitely</label>
      <label>Total eligible days physically present in NZ during the last 5 years<input type="number" min="0" max="1827" value={totalDays} onChange={e=>setTotalDays(Number(e.target.value)||0)}/></label>
      <div className={styles.years}><span>Eligible presence days in each 12-month period</span>{yearDays.map((v,i)=><label key={i}>Year {i+1}<input type="number" min="0" max="366" value={v} onChange={e=>setYear(i,Number(e.target.value)||0)}/></label>)}</div>
      <label className={styles.check}><input type="checkbox" checked={english} onChange={e=>setEnglish(e.target.checked)}/> I can speak English in everyday situations</label>
      <label className={styles.check}><input type="checkbox" checked={character} onChange={e=>setCharacter(e.target.checked)}/> I do not know of any character issue that may affect my application</label>
      <label className={styles.check}><input type="checkbox" checked={intendNz} onChange={e=>setIntendNz(e.target.checked)}/> I intend to continue living in New Zealand</label>
    </div>
    <div className={styles.result}>
      <span>Indicative result</span>
      <strong>{result.core?'You appear to meet the core adult grant criteria':'One or more core criteria may not be met'}</strong>
      <p>This is a screening tool, not an official citizenship decision. DIA checks immigration records, exact travel dates, identity, character and other statutory requirements.</p>
      {result.gaps.length>0&&<ul>{result.gaps.map(g=><li key={g}>{g}</li>)}</ul>}
      <a href="https://www.govt.nz/check-your-eligibility-for-citizenship/" target="_blank" rel="noreferrer">Use the official government eligibility checker →</a>
    </div>
  </div>;
}
