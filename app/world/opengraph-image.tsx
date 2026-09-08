import { ImageResponse } from 'next/og';
export const runtime='edge';
export const alt='Webfit News World Guides';
export const size={width:1200,height:630};
export const contentType='image/png';
export default function Image(){return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'72px',background:'linear-gradient(135deg, #0b1117 0%, #162331 100%)',color:'white',fontFamily:'Arial, sans-serif'}}><div style={{display:'flex',alignItems:'center',gap:18,fontSize:30,fontWeight:700}}><div style={{width:18,height:18,borderRadius:999,background:'#ffffff'}}/>Webfit News</div><div style={{display:'flex',flexDirection:'column',gap:24,maxWidth:980}}><div style={{fontSize:74,fontWeight:800,lineHeight:1.02}}>World Guides</div><div style={{fontSize:34,lineHeight:1.3,color:'#d7dee7'}}>Weather · Public Holidays · Visas · Currency · Gold · Time · Travel · AI · World News</div></div><div style={{fontSize:24,color:'#aab5c2'}}>webfitnews.com/world</div></div>,size);}
