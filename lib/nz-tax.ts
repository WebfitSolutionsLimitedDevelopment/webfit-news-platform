export const NZ_TAX_REFRESH_SECONDS=60*60*24*7;

export const nzTaxSources=[
  {name:'Inland Revenue — Tax rates for individuals',url:'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals'},
  {name:'Inland Revenue — PAYE calculator',url:'https://www.ird.govt.nz/paye-calculator'},
  {name:'Inland Revenue — ACC earners levy rates',url:'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/acc-clients-and-carers/acc-earners-levy-rates'},
  {name:'Inland Revenue — KiwiSaver changes',url:'https://www.ird.govt.nz/kiwisaver-changes'},
  {name:'Inland Revenue — Student loan repayments',url:'https://www.ird.govt.nz/repaying-my-student-loan-when-i-earn-salary-or-wages'},
] as const;

async function checkSource(url:string){
  try{
    const response=await fetch(url,{headers:{'User-Agent':'WebfitNews/1.0 (+https://www.webfitnews.com)'},next:{revalidate:NZ_TAX_REFRESH_SECONDS,tags:['nz-paye-tax-calculator']}});
    return response.ok;
  }catch{return false;}
}

export async function getNzTaxSnapshot(){
  const checks=await Promise.all(nzTaxSources.map(source=>checkSource(source.url)));
  return {
    checkedAt:new Date().toISOString(),
    sourcesChecked:checks.filter(Boolean).length,
    totalSources:nzTaxSources.length,
    sourceOk:checks.some(Boolean),
    taxYear:'1 April 2026 to 31 March 2027',
    accRate:1.75,
    accMaxEarnings:156641,
    kiwiSaverDefault:3.5,
    studentLoanThreshold:24128,
    studentLoanRate:12,
  };
}
