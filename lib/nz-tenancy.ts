export const nzTenancySources=[
  {label:'Rent increases — Tenancy Services',url:'https://www.tenancy.govt.nz/rent-bond-and-bills/rent/increasing-rent/'},
  {label:'Bond lodgement — Tenancy Services',url:'https://www.tenancy.govt.nz/rent-bond-and-bills/bond/about-lodging-a-bond/'},
  {label:'Ending a periodic tenancy — Tenancy Services',url:'https://www.tenancy.govt.nz/ending-a-tenancy/giving-notice-to-end-tenancy/ending-a-periodic-tenancy/'},
  {label:'Healthy homes standards — Tenancy Services',url:'https://www.tenancy.govt.nz/healthy-homes/healthy-homes-compliance/'},
  {label:'Residential Tenancies Act — NZ Legislation',url:'https://www.legislation.govt.nz/act/public/1986/0120/latest/whole.html'},
];

async function reachable(url:string){
  try{
    const res=await fetch(url,{next:{revalidate:86400},headers:{'user-agent':'WebfitNews/1.0'}});
    return res.ok;
  }catch{return false;}
}

export async function getNzTenancySnapshot(){
  const checks=await Promise.all(nzTenancySources.map(s=>reachable(s.url)));
  return {checkedAt:new Date().toISOString(),reachable:checks.filter(Boolean).length,total:checks.length};
}
