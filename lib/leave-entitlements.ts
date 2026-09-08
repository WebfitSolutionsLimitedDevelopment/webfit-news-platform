export const LEAVE_SOURCE_REVALIDATE_SECONDS=60*60*24;

export const leaveSources=[
  {label:'Employment New Zealand — Taking sick leave',url:'https://www.employment.govt.nz/leave-and-holidays/sick-leave/taking-sick-leave'},
  {label:'Employment New Zealand — Managing sick leave',url:'https://www.employment.govt.nz/leave-and-holidays/sick-leave/managing-sick-leave'},
  {label:'Employment New Zealand — Annual holidays',url:'https://www.employment.govt.nz/leave-and-holidays/annual-holidays'},
  {label:'Employment New Zealand — Taking annual holidays',url:'https://www.employment.govt.nz/leave-and-holidays/annual-holidays/taking-annual-holidays'},
];

async function checkSource(url:string){
  try{
    const response=await fetch(url,{next:{revalidate:LEAVE_SOURCE_REVALIDATE_SECONDS,tags:['nz-leave-entitlements']}});
    return response.ok;
  }catch{return false;}
}

export async function getLeaveSourceSnapshot(){
  const checks=await Promise.all(leaveSources.map(source=>checkSource(source.url)));
  return {checkedAt:new Date().toISOString(),sourcesChecked:checks.filter(Boolean).length,totalSources:leaveSources.length,sourceOk:checks.every(Boolean)};
}
