export const accLevySources=[
  {label:"IRD — ACC earners' levy rates",url:'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/acc-clients-and-carers/acc-earners-levy-rates'},
  {label:'ACC — Calculating your levies',url:'https://www.acc.co.nz/for-business/received-an-invoice/calculate-your-levies'},
  {label:'ACC — Levy results',url:'https://www.acc.co.nz/about-us/our-levies-2/levy-results'},
];

export async function getAccLevySnapshot(){
  const results=await Promise.all(accLevySources.map(async source=>{
    try{
      const response=await fetch(source.url,{next:{revalidate:86400}});
      return {...source,ok:response.ok};
    }catch{return {...source,ok:false};}
  }));
  return {checkedAt:new Date().toISOString(),reachable:results.filter(r=>r.ok).length,total:results.length};
}
