export const NZ_JOBS_REFRESH_SECONDS=60*60*12;

export const nzJobsSources=[
  {name:'Immigration New Zealand — How to find a job in New Zealand',url:'https://www.immigration.govt.nz/work/finding-work-in-new-zealand/how-to-find-a-job-in-new-zealand/'},
  {name:'Work and Income — Where to look for jobs',url:'https://www.workandincome.govt.nz/work/find-jobs/where-to-look-for-jobs.html'},
  {name:'Tahatū Career Navigator — How to look for jobs',url:'https://tahatu.govt.nz/work/looking-for-a-job/how-to-look-for-jobs'},
  {name:'Immigration New Zealand — Accredited employer list',url:'https://www.immigration.govt.nz/work/requirements-for-work-visas/approved-employers/accredited-employer-list/'},
  {name:'Employment New Zealand — Employee rights',url:'https://www.employment.govt.nz/starting-employment/rights-and-responsibilities/employee-rights-and-responsibilities'},
] as const;

async function checkSource(url:string){
  try{
    const response=await fetch(url,{headers:{'User-Agent':'WebfitNews/1.0 (+https://www.webfitnews.com)'},next:{revalidate:NZ_JOBS_REFRESH_SECONDS,tags:['jobs-in-new-zealand']}});
    return response.ok;
  }catch{return false;}
}

export async function getNzJobsSnapshot(){
  const checks=await Promise.all(nzJobsSources.map(source=>checkSource(source.url)));
  return {
    checkedAt:new Date().toISOString(),
    sourcesChecked:checks.filter(Boolean).length,
    sourceOk:checks.some(Boolean),
    totalSources:nzJobsSources.length,
  };
}
