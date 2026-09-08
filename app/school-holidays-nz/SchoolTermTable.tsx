'use client';

import styles from '@/components/UtilityGuide.module.css';

type Row={label:string,start:string,end:string,detail?:string};

function nzDateKey(date:Date){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get=(type:string)=>parts.find(p=>p.type===type)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function statusFor(row:Row,today:string){
  if(today<row.start)return 'Upcoming';
  if(today>row.end)return 'Past';
  return 'Current';
}

export default function SchoolTermTable({rows}:{rows:Row[]}){
  const today=nzDateKey(new Date());
  return <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Period</th><th>Dates</th><th>Status</th><th>Notes</th></tr></thead><tbody>{rows.map(row=>{
    const status=statusFor(row,today);
    const rowClass=status==='Past'?styles.pastRow:status==='Current'?styles.todayRow:styles.upcomingRow;
    const badgeClass=status==='Past'?styles.past:status==='Current'?styles.today:styles.upcoming;
    return <tr key={`${row.label}-${row.start}`} className={rowClass}><td className={status==='Past'?styles.pastText:undefined}><strong>{row.label}</strong></td><td className={status==='Past'?styles.pastText:undefined}>{row.start} to {row.end}</td><td><span className={`${styles.statusBadge} ${badgeClass}`}>{status}</span></td><td>{row.detail||'—'}</td></tr>;
  })}</tbody></table></div>;
}
