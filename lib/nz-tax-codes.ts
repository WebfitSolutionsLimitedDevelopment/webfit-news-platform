export const TAX_CODE_SOURCE_REVALIDATE_SECONDS=604800;

export const taxCodeSources=[
  {label:'What tax code should I use?',url:'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/what-tax-code-should-i-use'},
  {label:'About tax codes',url:'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/about-tax-codes'},
  {label:'Secondary tax codes',url:'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/secondary-tax-codes'},
  {label:'Complete my tax code declaration (IR330)',url:'https://www.ird.govt.nz/tax-code'},
];

export const secondaryTaxBands=[
  {code:'SB',min:0,max:15600,rate:10.5},
  {code:'S',min:15601,max:53500,rate:17.5},
  {code:'SH',min:53501,max:78100,rate:30},
  {code:'ST',min:78101,max:180000,rate:33},
  {code:'SA',min:180001,max:Infinity,rate:39},
];

export async function getTaxCodeSourceSnapshot(){
  const checks=await Promise.all(taxCodeSources.map(async source=>{
    try{
      const response=await fetch(source.url,{next:{revalidate:TAX_CODE_SOURCE_REVALIDATE_SECONDS}});
      return {...source,ok:response.ok};
    }catch{return {...source,ok:false};}
  }));
  return {checkedAt:new Date().toISOString(),sourcesChecked:checks.filter(x=>x.ok).length,totalSources:checks.length,checks};
}
