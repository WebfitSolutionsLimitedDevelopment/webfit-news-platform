export type RecallItem={
  title:string;
  url:string;
  source:'Product Safety NZ'|'MPI Food Safety';
  date?:string;
  categories?:string[];
};

export type RecallFeed={
  items:RecallItem[];
  ok:boolean;
  checkedAt:string;
};

const PRODUCT_SAFETY_URL='https://www.productsafety.govt.nz/recalls?sort=latest';
const MPI_RECALLS_URL='https://www.mpi.govt.nz/food-safety-home/food-recalls-and-complaints/recalled-food-products';

function cleanText(value:string){
  return value
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&#39;|&apos;/g,"'")
    .replace(/&quot;/g,'"')
    .replace(/&nbsp;/g,' ')
    .replace(/&#8217;|&rsquo;/g,'’')
    .replace(/\s+/g,' ')
    .trim();
}

async function fetchHtml(url:string){
  const response=await fetch(url,{
    headers:{'user-agent':'WebfitNews-RecallCentre/1.0 (+https://webfitnews.com/recalls)'},
    next:{revalidate:1800},
  });
  if(!response.ok)throw new Error(`Recall source returned ${response.status}`);
  return response.text();
}

function absolute(base:string,href:string){
  try{return new URL(href,base).toString();}catch{return base;}
}

function unique(items:RecallItem[]){
  const seen=new Set<string>();
  return items.filter(item=>{const key=item.url.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});
}

function parseProductSafety(html:string):RecallItem[]{
  const matches=[...html.matchAll(/<a\b[^>]*href=["']([^"']*\/recalls\/[^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const items:RecallItem[]=[];
  for(const match of matches){
    const text=cleanText(match[2]);
    const dated=text.match(/^(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+(.+)$/);
    if(!dated||dated[2].length<4)continue;
    items.push({title:dated[2],date:dated[1],url:absolute('https://www.productsafety.govt.nz',match[1]),source:'Product Safety NZ'});
  }
  return unique(items).slice(0,18);
}

function parseMpi(html:string):RecallItem[]{
  const matches=[...html.matchAll(/<a\b[^>]*href=["']([^"']*\/food-safety-home\/food-recalls-and-complaints\/recalled-food-products\/[^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const items:RecallItem[]=[];
  for(const match of matches){
    const title=cleanText(match[2]);
    if(title.length<4||/subscribe|food recalls|information for/i.test(title))continue;
    items.push({title,url:absolute('https://www.mpi.govt.nz',match[1]),source:'MPI Food Safety',categories:['Food']});
  }
  return unique(items).slice(0,18);
}

async function loadProductSafety():Promise<RecallFeed>{
  const checkedAt=new Date().toISOString();
  try{return{items:parseProductSafety(await fetchHtml(PRODUCT_SAFETY_URL)),ok:true,checkedAt};}
  catch{return{items:[],ok:false,checkedAt};}
}

async function loadMpi():Promise<RecallFeed>{
  const checkedAt=new Date().toISOString();
  try{return{items:parseMpi(await fetchHtml(MPI_RECALLS_URL)),ok:true,checkedAt};}
  catch{return{items:[],ok:false,checkedAt};}
}

export async function getNzRecalls(){
  const [products,food]=await Promise.all([loadProductSafety(),loadMpi()]);
  return{products,food,official:{productSafety:PRODUCT_SAFETY_URL,mpi:MPI_RECALLS_URL}};
}
