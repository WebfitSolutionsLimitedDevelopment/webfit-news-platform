import {XMLParser} from 'fast-xml-parser';

export type NzAlert={
  id:string;
  kind:'earthquake'|'weather'|'emergency';
  title:string;
  detail:string;
  time?:string;
  url:string;
  severity?:string;
};

export type VolcanoStatus={
  id:string;
  title:string;
  level:number;
  aviationCode?:string;
  activity?:string;
  hazards?:string;
};

type SourceResult<T>={ok:boolean;items:T[]};

const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',trimValues:true});
const FETCH_OPTS={next:{revalidate:300}} as const;

function asArray<T>(value:T|T[]|undefined|null):T[]{return value==null?[]:Array.isArray(value)?value:[value];}
function text(value:unknown):string{
  if(typeof value==='string'||typeof value==='number')return String(value);
  if(value&&typeof value==='object'){
    const obj=value as Record<string,unknown>;
    if(typeof obj['#text']==='string')return obj['#text'];
  }
  return '';
}
function linkFrom(value:unknown):string{
  if(typeof value==='string')return value;
  for(const item of asArray(value as any)){
    if(item&&typeof item==='object'){
      const obj=item as Record<string,unknown>;
      const href=obj['@_href'];
      if(typeof href==='string')return href;
    }
  }
  return '';
}
function clean(value:string){return value.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}

async function getQuakes():Promise<SourceResult<NzAlert>>{
  try{
    const response=await fetch('https://api.geonet.org.nz/quake?MMI=3',{...FETCH_OPTS,headers:{Accept:'application/vnd.geo+json;version=2'}});
    if(!response.ok)throw new Error(`GeoNet quakes ${response.status}`);
    const json=await response.json() as {features?:Array<{properties?:Record<string,unknown>}>};
    const items=(json.features||[]).slice(0,20).map((feature,index)=>{
      const p=feature.properties||{};
      const publicID=String(p.publicID||index);
      const magnitude=Number(p.magnitude||0);
      const locality=String(p.locality||'New Zealand region');
      const depth=Number(p.depth||0);
      return {id:`quake-${publicID}`,kind:'earthquake' as const,title:`M${magnitude.toFixed(1)} earthquake — ${locality}`,detail:`Depth ${Math.round(depth)} km · calculated shaking MMI ${String(p.mmi??'–')}`,time:String(p.time||''),url:`https://www.geonet.org.nz/earthquake/${encodeURIComponent(publicID)}`,severity:magnitude>=6?'Major':magnitude>=5?'Strong':'Felt'};
    });
    return {ok:true,items};
  }catch(error){console.error('NZ alerts: GeoNet quakes unavailable',error);return {ok:false,items:[]};}
}

async function getVolcanoes():Promise<SourceResult<VolcanoStatus>>{
  try{
    const response=await fetch('https://api.geonet.org.nz/volcano/val',{...FETCH_OPTS,headers:{Accept:'application/vnd.geo+json;version=2'}});
    if(!response.ok)throw new Error(`GeoNet volcano ${response.status}`);
    const json=await response.json() as {features?:Array<{properties?:Record<string,unknown>}>};
    const items=(json.features||[]).map((feature,index)=>{
      const p=feature.properties||{};
      return {id:String(p.volcanoID||index),title:String(p.volcanoTitle||'NZ volcano'),level:Number(p.level||0),aviationCode:String(p.acc||''),activity:String(p.activity||''),hazards:String(p.hazards||'')};
    }).sort((a,b)=>b.level-a.level||a.title.localeCompare(b.title));
    return {ok:true,items};
  }catch(error){console.error('NZ alerts: GeoNet volcano unavailable',error);return {ok:false,items:[]};}
}

async function getCapFeed(url:string,kind:'weather'|'emergency',sourceName:string):Promise<SourceResult<NzAlert>>{
  try{
    const response=await fetch(url,FETCH_OPTS);
    if(!response.ok)throw new Error(`${sourceName} ${response.status}`);
    const xml=parser.parse(await response.text()) as Record<string,any>;
    const channel=xml?.rss?.channel;
    const rssItems=asArray(channel?.item);
    const atomItems=asArray(xml?.feed?.entry);
    const raw=[...rssItems,...atomItems];
    const items=raw.slice(0,20).map((item:any,index)=>{
      const title=text(item?.title)||`${sourceName} alert`;
      const description=clean(text(item?.description)||text(item?.summary)||text(item?.content));
      const link=linkFrom(item?.link)||text(item?.link)||url;
      const when=text(item?.pubDate)||text(item?.updated)||text(item?.published);
      const guid=text(item?.guid)||text(item?.id)||`${kind}-${index}-${title}`;
      return {id:`${kind}-${guid}`,kind,title,detail:description||`Official ${sourceName} alert. Open the source for full details and instructions.`,time:when,url:link};
    });
    return {ok:true,items};
  }catch(error){console.error(`NZ alerts: ${sourceName} unavailable`,error);return {ok:false,items:[]};}
}

export async function getNzAlerts(){
  const [earthquakes,volcanoes,weather,emergency]=await Promise.all([
    getQuakes(),
    getVolcanoes(),
    getCapFeed('https://alerts.metservice.com/cap/rss','weather','MetService'),
    getCapFeed('https://alerthub.civildefence.govt.nz/rss/pwp','emergency','NEMA Alert Hub'),
  ]);
  return {
    earthquakes,volcanoes,weather,emergency,
    checkedAt:new Date().toISOString(),
    official:{geonet:'https://www.geonet.org.nz/',metservice:'https://www.metservice.com/warnings/home',nema:'https://www.civildefence.govt.nz/'}
  };
}
