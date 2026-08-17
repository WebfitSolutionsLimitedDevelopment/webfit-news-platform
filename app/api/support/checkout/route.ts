import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/env';

export const runtime='nodejs';

export async function POST(request:Request){
  let amount:number;
  try{const body=await request.json();amount=Number(body.amount);}catch{return NextResponse.json({error:'Invalid contribution request.'},{status:400});}
  if(!Number.isFinite(amount)||amount<5||amount>10000)return NextResponse.json({error:'Contribution must be between NZ$5 and NZ$10,000.'},{status:400});
  const secret=process.env.STRIPE_SECRET_KEY?.trim();
  if(!secret)return NextResponse.json({error:'Secure contributions are being prepared. Stripe has not been connected yet.'},{status:503});
  const site=getSiteUrl();
  const cents=Math.round(amount*100);
  const form=new URLSearchParams();
  form.set('mode','payment');
  form.set('success_url',`${site}/support-us/success?session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url',`${site}/support-us`);
  form.set('line_items[0][price_data][currency]','nzd');
  form.set('line_items[0][price_data][unit_amount]',String(cents));
  form.set('line_items[0][price_data][product_data][name]','Support Webfit News');
  form.set('line_items[0][price_data][product_data][description]','One-off reader contribution to independent journalism and community reporting.');
  form.set('line_items[0][quantity]','1');
  form.set('metadata[source]','webfit-news-support');
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{authorization:`Bearer ${secret}`,'content-type':'application/x-www-form-urlencoded'},body:form.toString(),cache:'no-store'});
  const data=await response.json();
  if(!response.ok||!data.url)return NextResponse.json({error:'Unable to start secure payment.'},{status:502});
  return NextResponse.json({url:data.url});
}
