export const citizenshipSources=[
  {label:'NZ citizenship requirements',url:'https://www.govt.nz/browse/passports-citizenship-and-identity/nz-citizenship/requirements-for-nz-citizenship/'},
  {label:'Presence in NZ requirements',url:'https://www.govt.nz/browse/passports-citizenship-and-identity/nz-citizenship/requirements-for-nz-citizenship/presence-requirements/'},
  {label:'How to apply for NZ citizenship',url:'https://www.govt.nz/browse/passports-citizenship-and-identity/nz-citizenship/how-to-apply-for-nz-citizenship/'},
  {label:'Citizenship fees',url:'https://www.govt.nz/browse/passports-citizenship-and-identity/nz-citizenship/citizenship-fees/'},
  {label:'Citizenship test',url:'https://www.govt.nz/browse/passports-citizenship-and-identity/nz-citizenship/citizenship-test/'},
];

export async function getCitizenshipSnapshot(){
  const checkedAt=new Date().toISOString();
  const results=await Promise.all(citizenshipSources.map(async s=>{
    try{
      const r=await fetch(s.url,{next:{revalidate:86400}});
      return {url:s.url,ok:r.ok};
    }catch{return {url:s.url,ok:false};}
  }));
  return {checkedAt,reachable:results.filter(r=>r.ok).length,total:results.length};
}
