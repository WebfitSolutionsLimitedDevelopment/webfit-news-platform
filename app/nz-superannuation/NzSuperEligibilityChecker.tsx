'use client';

import {useMemo,useState} from 'react';

function requiredYears(date:string){
  if(!date)return null;
  const d=new Date(`${date}T00:00:00`);
  if(Number.isNaN(d.getTime()))return null;
  const y=d.getUTCFullYear(),m=d.getUTCMonth()+1,day=d.getUTCDate();
  const n=y*10000+m*100+day;
  if(n<=19590630)return 10;
  if(n<=19610630)return 11;
  if(n<=19630630)return 12;
  if(n<=19650630)return 13;
  if(n<=19670630)return 14;
  if(n<=19690630)return 15;
  if(n<=19710630)return 16;
  if(n<=19730630)return 17;
  if(n<=19750630)return 18;
  if(n<=19770630)return 19;
  return 20;
}

export default function NzSuperEligibilityChecker(){
  const [dob,setDob]=useState('1961-03-28');
  const [age65,setAge65]=useState(true);
  const [status,setStatus]=useState(true);
  const [ordinarilyResident,setOrdinarilyResident]=useState(true);
  const [years20,setYears20]=useState(11);
  const [years50,setYears50]=useState(5);
  const need=useMemo(()=>requiredYears(dob),[dob]);
  const residenceOk=need!==null&&years20>=need&&years50>=5;
  const likely=age65&&status&&ordinarilyResident&&residenceOk;
  return <div style={{display:'grid',gap:'1rem'}}>
    <label>Date of birth<input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={{display:'block',width:'100%',marginTop:'.35rem',padding:'.75rem'}}/></label>
    <label>Years lived in NZ from age 20<input type="number" min="0" max="60" value={years20} onChange={e=>setYears20(Number(e.target.value))} style={{display:'block',width:'100%',marginTop:'.35rem',padding:'.75rem'}}/></label>
    <label>Years lived in NZ from age 50<input type="number" min="0" max="30" value={years50} onChange={e=>setYears50(Number(e.target.value))} style={{display:'block',width:'100%',marginTop:'.35rem',padding:'.75rem'}}/></label>
    <label><input type="checkbox" checked={age65} onChange={e=>setAge65(e.target.checked)}/> I am 65 or older</label>
    <label><input type="checkbox" checked={status} onChange={e=>setStatus(e.target.checked)}/> I am an NZ citizen, permanent resident, or hold a residence class visa</label>
    <label><input type="checkbox" checked={ordinarilyResident} onChange={e=>setOrdinarilyResident(e.target.checked)}/> I am ordinarily resident in NZ, the Cook Islands, Niue or Tokelau when applying</label>
    <div style={{padding:'1rem',border:'1px solid #d7d7d7',borderRadius:'12px'}}>
      <strong>{likely?'You appear to meet the core criteria':'One or more core criteria may not be met yet'}</strong>
      <p style={{marginBottom:0}}>Based on your date of birth, the standard residence requirement is <strong>{need??'—'} years from age 20</strong>, including at least <strong>5 years from age 50</strong>.</p>
    </div>
    <small>This is a screening tool, not an eligibility decision. Social Security Agreement countries, NZ Realm countries, refugee/protected-person rules and overseas pensions can change the result.</small>
  </div>;
}
