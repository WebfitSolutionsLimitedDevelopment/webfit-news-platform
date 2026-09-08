export const ratesRebateSources=[
  {label:'NZ Government — What is a rates rebate',url:'https://www.govt.nz/browse/housing-and-property/getting-help-with-housing/getting-a-rates-rebate/what-is-a-rates-rebate/'},
  {label:'NZ Legislation — Rates Rebate Act 1973',url:'https://www.legislation.govt.nz/act/public/1973/5/en/latest/'},
  {label:'NZ Legislation — Rates Rebate (Specified Amounts) Order 2026',url:'https://www.legislation.govt.nz/secondary-legislation/pco-drafted/2026/84/en/latest/'},
];

export async function getRatesRebateSnapshot(){
  const results=await Promise.all(ratesRebateSources.map(async source=>{
    try{
      const response=await fetch(source.url,{next:{revalidate:86400}});
      return {...source,ok:response.ok};
    }catch{return {...source,ok:false};}
  }));
  return {checkedAt:new Date().toISOString(),reachable:results.filter(r=>r.ok).length,total:results.length};
}
