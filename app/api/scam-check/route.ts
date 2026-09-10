import {NextResponse} from 'next/server';
import {z} from 'zod';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const requestSchema=z.object({query:z.string().trim().min(2).max(180)});
const FMA_URL='https://www.fma.govt.nz/library/warnings-and-alerts/';
const NZBN_URL='https://www.nzbn.govt.nz/mynzbn/nzbndetails/';
const NZBN_API='https://api.business.govt.nz/gateway/nzbn/v5/entities';

function detectType(value:string){
  const compact=value.replace(/\s/g,'');
  if(/^\d{13}$/.test(compact))return 'NZBN';
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return 'email address';
  if(/^(https?:\/\/|www\.)/i.test(value)||/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(value))return 'website';
  if(/^\+?[\d\s().-]{7,}$/.test(value))return 'phone number';
  return 'business or trading name';
}

function normalise(value:string){
  return value.toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/[^a-z0-9@.+-]+/g,' ').trim();
}

function stripHtml(value:string){return value.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}

async function checkRecentFmaWarnings(query:string){
  const needle=normalise(query);
  const starts=[0,15,30,45,60];
  try{
    const pages=await Promise.all(starts.map(async start=>{
      const response=await fetch(`${FMA_URL}?start=${start}`,{headers:{'User-Agent':'WebfitNews-ScamCheck/1.0'},next:{revalidate:3600}});
      return response.ok?response.text():'';
    }));
    const combined=pages.join('\n');
    const text=normalise(stripHtml(combined));
    if(needle.length>=3&&text.includes(needle)){
      const escaped=needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'[\\s\\W]+');
      const linkPattern=new RegExp(`<a[^>]+href=["']([^"']*warnings-and-alerts[^"']+)["'][^>]*>([\\s\\S]{0,600}?${escaped}[\\s\\S]{0,600}?)<\\/a>`,'i');
      const match=combined.match(linkPattern);
      const matched=match?stripHtml(match[2]).slice(0,240):query;
      return {matched:true,matchedText:matched};
    }
    return {matched:false};
  }catch{return {matched:false,unavailable:true};}
}

function pickFirstEntity(body:any){
  const collection=Array.isArray(body)?body:Array.isArray(body?.items)?body.items:Array.isArray(body?.entities)?body.entities:Array.isArray(body?.results)?body.results:[];
  return collection[0]||null;
}

async function checkNzbn(query:string){
  const key=process.env.NZBN_API_KEY?.trim();
  if(!key)return {configured:false};
  try{
    const compact=query.replace(/\s/g,'');
    const exactNzbn=/^\d{13}$/.test(compact);
    const url=exactNzbn?`${NZBN_API}/${encodeURIComponent(compact)}`:`${NZBN_API}?search-term=${encodeURIComponent(query)}&page-size=5`;
    const response=await fetch(url,{headers:{Accept:'application/json','Ocp-Apim-Subscription-Key':key},cache:'no-store'});
    if(!response.ok)return {configured:true,found:false,unavailable:true};
    const body=await response.json();
    const entity=exactNzbn?body:pickFirstEntity(body);
    if(!entity)return {configured:true,found:false};
    return {
      configured:true,
      found:true,
      name:entity.entityName||entity.name||entity.registeredName||entity.tradingName||undefined,
      nzbn:String(entity.nzbn||entity.NZBN||compact||''),
      entityStatus:entity.entityStatusDescription||entity.entityStatus||entity.status||undefined,
    };
  }catch{return {configured:true,found:false,unavailable:true};}
}

export async function POST(request:Request){
  let raw:unknown;
  try{raw=await request.json();}catch{return NextResponse.json({error:'Invalid request.'},{status:400});}
  const parsed=requestSchema.safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:'Enter between 2 and 180 characters.'},{status:400});

  const query=parsed.data.query;
  const queryType=detectType(query);
  const [fma,nzbn]=await Promise.all([checkRecentFmaWarnings(query),checkNzbn(query)]);

  const warning=Boolean(fma.matched);
  const level=warning?'warning':'unknown';
  const headline=warning?'Official FMA warning evidence found':'No warning match found in the recent FMA feed checked';
  const explanation=warning
    ?'The value you entered appears in recent Financial Markets Authority warning material. Do not send money or personal information until you have read the official warning and independently verified the identity involved.'
    :'This is not a “safe” result. The FMA says its warning list is not exhaustive. Check the official sources below and independently verify payment details, domain names and contact information before proceeding.';

  const fmaResult=fma.unavailable
    ?{status:'Source temporarily unavailable',detail:'The recent FMA warnings feed could not be checked during this request. Use the official database directly.',url:FMA_URL}
    :warning
      ?{status:'Warning evidence found',detail:`A match for your ${queryType} was detected in the recent FMA warning pages checked by Webfit News.`,matched:fma.matchedText,url:FMA_URL}
      :{status:'No recent match detected',detail:'No exact match was detected in the recent FMA warning pages sampled by this checker. This does not search every historical warning and is not proof of legitimacy.',url:FMA_URL};

  const officialNzbnSearch=`https://www.nzbn.govt.nz/search/?search=${encodeURIComponent(query)}`;
  const nzbnResult=!nzbn.configured
    ?{status:'Official API not connected',detail:'Live NZBN verification requires an approved NZBN API subscription key. Webfit News has not claimed a registration result without that credential.',url:officialNzbnSearch}
    :nzbn.unavailable
      ?{status:'Registry check unavailable',detail:'The NZBN API did not return a usable result during this request. Verify directly on the official NZBN Register.',url:officialNzbnSearch}
      :nzbn.found
        ?{status:'NZBN record found',detail:'An NZBN record was returned by the official NZBN API. Registration by itself does not prove that a website, caller or investment offer is genuine.',url:officialNzbnSearch,name:nzbn.name,nzbn:nzbn.nzbn,entityStatus:nzbn.entityStatus}
        :{status:'No NZBN record found',detail:'The official NZBN API did not return a matching record for this search. Try the official register directly and check spelling or trading names.',url:officialNzbnSearch};

  return NextResponse.json({query,queryType,level,headline,explanation,fma:fmaResult,nzbn:nzbnResult,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
}
