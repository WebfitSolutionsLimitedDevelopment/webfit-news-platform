import fs from 'node:fs';
import path from 'node:path';

const routes=[
  '/minimum-wage','/nz-paye-calculator','/nz-acc-levy-calculator','/nz-tax-code-finder','/nz-kiwisaver-calculator','/nz-student-loan-calculator','/nz-superannuation','/nz-citizenship','/nz-rates-rebate-calculator','/nz-tenancy-rent-guide','/nz-holiday-pay-calculator','/nz-leave-entitlement-calculator','/public-holidays','/school-holidays-nz','/immigration','/visitor-visa-nz','/new-zealand-passport-application','/nz-passport-renewal','/jobs-in-new-zealand','/government-jobs-nz'
];

const root=process.cwd();
const sitemap=fs.readFileSync(path.join(root,'app/sitemap.ts'),'utf8');
const catalog=fs.readFileSync(path.join(root,'lib/nz-guide-catalog.ts'),'utf8');
const failures=[];
const seenTitles=new Map();
const seenDescriptions=new Map();
const primaryQueries=new Map();
const currentYear=new Date().getFullYear();

const literal=(area,key)=>{
  const match=area.match(new RegExp(`${key}\\s*:\\s*['\"]([^'\"]+)['\"]`));
  return match?.[1]?.trim()||null;
};

for(const route of routes){
  const file=path.join(root,'app',route.slice(1),'page.tsx');
  if(!fs.existsSync(file)){
    failures.push(`${route}: page.tsx is missing`);
    continue;
  }

  const source=fs.readFileSync(file,'utf8');
  const metadataArea=source.slice(0,9000);
  if(!/export\s+(const\s+metadata|async\s+function\s+generateMetadata|function\s+generateMetadata)/.test(metadataArea)) failures.push(`${route}: metadata export is missing`);

  const title=literal(metadataArea,'title');
  const description=literal(metadataArea,'description');
  if(!title) failures.push(`${route}: literal SEO title is missing`);
  if(!description) failures.push(`${route}: literal meta description is missing`);

  if(title){
    if(title.length<25||title.length>75) failures.push(`${route}: title length ${title.length} is outside the 25–75 character quality range`);
    if(seenTitles.has(title)) failures.push(`${route}: duplicate SEO title also used by ${seenTitles.get(title)}`);
    else seenTitles.set(title,route);
    const years=[...title.matchAll(/\b20(\d{2})\b/g)].map(match=>Number(match[0]));
    if(years.some(year=>year<currentYear)) failures.push(`${route}: title contains stale year ${years.find(year=>year<currentYear)}; current year is ${currentYear}`);
  }

  if(description){
    if(description.length<80||description.length>190) failures.push(`${route}: description length ${description.length} is outside the 80–190 character quality range`);
    if(seenDescriptions.has(description)) failures.push(`${route}: duplicate meta description also used by ${seenDescriptions.get(description)}`);
    else seenDescriptions.set(description,route);
  }

  const escapedRoute=route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!new RegExp(`canonical\\s*:\\s*['\"]${escapedRoute}['\"]`).test(metadataArea)) failures.push(`${route}: self-referencing canonical is missing or does not match the route`);
  if(!/openGraph\s*:/.test(metadataArea)) failures.push(`${route}: Open Graph metadata is missing`);
  if(!new RegExp(`openGraph[\\s\\S]{0,1200}?url\\s*:\\s*['\"]${escapedRoute}['\"]`).test(metadataArea)) failures.push(`${route}: Open Graph URL is missing or does not match the canonical route`);
  if(!/<h1(?:\s|>)/.test(source)) failures.push(`${route}: visible H1 is missing`);
  if(/noindex|index\s*:\s*false/i.test(metadataArea)) failures.push(`${route}: appears to be marked noindex`);
  if(/https:\/\/www\.webfitnews\.com/i.test(source)) failures.push(`${route}: legacy www.webfitnews.com URL found; use canonical https://webfitnews.com`);
  if(!sitemap.includes(route)) failures.push(`${route}: sitemap entry is missing`);
  if(!catalog.includes(`href:'${route}'`)&&!catalog.includes(`href:\"${route}\"`)) failures.push(`${route}: NZ guide catalog entry is missing`);

  const catalogMatch=catalog.match(new RegExp(`href:['\"]${escapedRoute}['\"][\\s\\S]{0,1000}?searchTerms:\\[['\"]([^'\"]+)['\"]`));
  if(!catalogMatch){
    failures.push(`${route}: primary search query is missing from NZ guide catalog`);
  }else{
    const query=catalogMatch[1].toLowerCase().trim();
    if(primaryQueries.has(query)) failures.push(`${route}: primary query “${query}” is also owned by ${primaryQueries.get(query)}`);
    else primaryQueries.set(query,route);
  }
}

if(failures.length){
  console.error('\nNZ guide SEO regression check failed:\n');
  for(const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`NZ guide SEO regression check passed for ${routes.length} evergreen pages.`);
console.log(`Validated unique titles, descriptions and primary-query ownership; canonical host and year freshness are protected.`);
