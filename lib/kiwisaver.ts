export const KIWISAVER_REVALIDATE_SECONDS=60*60*24*7;

export const kiwiSaverSources=[
  {label:'IRD KiwiSaver changes',url:'https://www.ird.govt.nz/kiwisaver-changes'},
  {label:'IRD employee contribution rates',url:'https://www.ird.govt.nz/kiwisaver/kiwisaver-individuals/growing-my-kiwisaver-account/employee-contributions-to-kiwisaver'},
  {label:'IRD employer contributions',url:'https://www.ird.govt.nz/kiwisaver/kiwisaver-employers/contributions-and-deductions/calculate-kiwisaver-deductions-and-contributions'},
  {label:'IRD ESCT',url:'https://www.ird.govt.nz/esct'},
];

async function checkSource(url:string){
  try{
    const res=await fetch(url,{next:{revalidate:KIWISAVER_REVALIDATE_SECONDS,tags:['nz-kiwisaver-calculator']}});
    return res.ok;
  }catch{return false;}
}

export async function getKiwiSaverSnapshot(){
  const checks=await Promise.all(kiwiSaverSources.map(s=>checkSource(s.url)));
  return {
    checkedAt:new Date().toISOString(),
    sourcesChecked:checks.filter(Boolean).length,
    totalSources:kiwiSaverSources.length,
    defaultRate:3.5,
    temporaryRate:3,
    nextDefaultRate:4,
    nextChangeDate:'1 April 2028',
    governmentMatchRate:0.25,
    governmentMax:260.72,
    governmentIncomeLimit:180000,
  };
}
