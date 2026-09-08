export const STUDENT_LOAN_REVALIDATE_SECONDS=604800;

export const studentLoanSources=[
  {label:'IRD — Repaying my student loan when I earn salary or wages',url:'https://www.ird.govt.nz/repaying-my-student-loan-when-i-earn-salary-or-wages'},
  {label:'IRD — Employer guide: student loan repayment deductions',url:'https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir300---ir399/ir335/ir335.pdf'},
  {label:'IRD — When I pay off my student loan',url:'https://www.ird.govt.nz/student-loans/living-in-new-zealand-with-a-student-loan/when-i-pay-off-my-student-loan'},
];

export async function getStudentLoanSnapshot(){
  const checkedAt=new Date().toISOString();
  const checks=await Promise.all(studentLoanSources.map(async source=>{
    try{
      const response=await fetch(source.url,{next:{revalidate:STUDENT_LOAN_REVALIDATE_SECONDS}});
      return {url:source.url,ok:response.ok};
    }catch{return {url:source.url,ok:false};}
  }));
  return {
    checkedAt,
    sourcesChecked:checks.filter(x=>x.ok).length,
    totalSources:checks.length,
    annualThreshold:24128,
    repaymentRate:0.12,
    thresholds:{weekly:464,fortnightly:928,threeWeekly:1392,fourWeekly:1856,monthly:2010.66},
  };
}
