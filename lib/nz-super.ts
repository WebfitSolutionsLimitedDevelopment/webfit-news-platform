export const nzSuperSources=[
  {label:'Work and Income — Who can get NZ Super',url:'https://www.workandincome.govt.nz/eligibility/seniors/superannuation/who-can-get-it/index.html'},
  {label:'Work and Income — NZ Super rates from 1 April 2026',url:'https://www.workandincome.govt.nz/products/benefit-rates/benefit-rates-april-2026.html'},
  {label:'Work and Income — NZ Super payment dates',url:'https://www.workandincome.govt.nz/eligibility/seniors/superannuation/payment-dates/index.html'},
  {label:'Work and Income — Overseas pensions',url:'https://www.workandincome.govt.nz/eligibility/moving-to-nz/overseas-pensions/index.html'},
];

export type NzSuperSnapshot={checkedAt:string;reachable:number;total:number};

export async function getNzSuperSnapshot():Promise<NzSuperSnapshot>{
  const results=await Promise.all(nzSuperSources.map(async source=>{
    try{
      const res=await fetch(source.url,{next:{revalidate:86400}});
      return res.ok;
    }catch{return false;}
  }));
  return {checkedAt:new Date().toISOString(),reachable:results.filter(Boolean).length,total:results.length};
}
