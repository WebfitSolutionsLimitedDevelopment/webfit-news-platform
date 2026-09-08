import fs from 'node:fs';
import path from 'node:path';

const routes=[
  '/minimum-wage','/nz-paye-calculator','/nz-acc-levy-calculator','/nz-tax-code-finder','/nz-kiwisaver-calculator','/nz-student-loan-calculator','/nz-superannuation','/nz-citizenship','/nz-rates-rebate-calculator','/nz-tenancy-rent-guide','/nz-holiday-pay-calculator','/nz-leave-entitlement-calculator','/public-holidays','/school-holidays-nz','/immigration','/visitor-visa-nz','/new-zealand-passport-application','/nz-passport-renewal','/jobs-in-new-zealand','/government-jobs-nz'
];

const root=process.cwd();
const sitemap=fs.readFileSync(path.join(root,'app/sitemap.ts'),'utf8');
const catalog=fs.readFileSync(path.join(root,'lib/nz-guide-catalog.ts'),'utf8');
const failures=[];

for(const route of routes){
  const file=path.join(root,'app',route.slice(1),'page.tsx');
  if(!fs.existsSync(file)){
    failures.push(`${route}: page.tsx is missing`);
    continue;
  }
  const source=fs.readFileSync(file,'utf8');
  const metadataArea=source.slice(0,7000);
  if(!/export\s+(const\s+metadata|async\s+function\s+generateMetadata|function\s+generateMetadata)/.test(metadataArea)) failures.push(`${route}: metadata export is missing`);
  if(!/title\s*:/.test(metadataArea)) failures.push(`${route}: SEO title is missing`);
  if(!/description\s*:/.test(metadataArea)) failures.push(`${route}: meta description is missing`);
  if(!new RegExp(`canonical\\s*:\\s*['\"]${route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}['\"]`).test(metadataArea)) failures.push(`${route}: self-referencing canonical is missing or does not match the route`);
  if(!/openGraph\s*:/.test(metadataArea)) failures.push(`${route}: Open Graph metadata is missing`);
  if(!/<h1(?:\s|>)/.test(source)) failures.push(`${route}: visible H1 is missing`);
  if(/noindex|index\s*:\s*false/i.test(metadataArea)) failures.push(`${route}: appears to be marked noindex`);
  if(!sitemap.includes(route)) failures.push(`${route}: sitemap entry is missing`);
  if(!catalog.includes(`href:'${route}'`)&&!catalog.includes(`href:\"${route}\"`)) failures.push(`${route}: NZ guide catalog entry is missing`);
}

if(failures.length){
  console.error('\nNZ guide SEO regression check failed:\n');
  for(const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`NZ guide SEO regression check passed for ${routes.length} evergreen pages.`);
