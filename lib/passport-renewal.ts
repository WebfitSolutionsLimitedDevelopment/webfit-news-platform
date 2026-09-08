export const PASSPORT_REFRESH_SECONDS=60*60*24*7;
export const passportSources=[
{name:'New Zealand Passports — Costs',url:'https://www.passports.govt.nz/passport-costs',primary:true},
{name:'New Zealand Passports — Timeframes',url:'https://www.passports.govt.nz/passport-costs/passport-timeframes',primary:false},
{name:'New Zealand Passports — What you need',url:'https://www.passports.govt.nz/what-you-need-for-your-application',primary:false},
{name:'New Zealand Passports — Apply online',url:'https://www.passports.govt.nz/most-citizens-can-apply-for-their-passport-online/most-citizens-can-apply-for-their-passport-online',primary:false},
] as const;
function text(html:string){return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim()}
async function fetchPage(url:string){try{const r=await fetch(url,{headers:{'User-Agent':'WebfitNews/1.0 (+https://www.webfitnews.com)'},next:{revalidate:PASSPORT_REFRESH_SECONDS,tags:['nz-passport-renewal']}});return r.ok?text(await r.text()):null}catch{return null}}
function matchNumber(value:string|null,re:RegExp,fallback:string){return value?.match(re)?.[1]?.trim()||fallback}
export async function getPassportSnapshot(){const pages=await Promise.all(passportSources.map(s=>fetchPage(s.url)));const costs=pages[0],times=pages[1];return{
adultStandard:matchNumber(costs,/Adult passport:\s*NZD\$\s*([0-9.]+)/i,'247.00'),
childStandard:matchNumber(costs,/Child passport:\s*NZD\$\s*([0-9.]+)/i,'144.00'),
adultUrgent:matchNumber(costs,/Urgent passport[\s\S]{0,350}?Adult passport:\s*NZD\$\s*([0-9.]+)/i,'494.00'),
standardTime:matchNumber(times,/Allow at least\s+([^.]*)/i,'4 weeks (20 working days)'),
urgentTime:matchNumber(times,/urgent processing[^.]*?within\s+([^,.]*)/i,'3 working days'),
checkedAt:new Date().toISOString(),sourceOk:Boolean(costs&&times),sourcesChecked:pages.filter(Boolean).length};}
