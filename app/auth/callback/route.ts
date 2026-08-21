import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const PRODUCTION_ORIGIN='https://webfitnews.com';

export async function GET(request:Request){
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  const requestedNext=url.searchParams.get('next')||'/';
  const next=requestedNext.startsWith('/')&&!requestedNext.startsWith('//')?requestedNext:'/';
  if(code){
    const supabase=await createClient();
    const {error}=await supabase.auth.exchangeCodeForSession(code);
    if(error){
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`,PRODUCTION_ORIGIN));
    }
  }
  const origin=process.env.NODE_ENV==='production'?PRODUCTION_ORIGIN:url.origin;
  return NextResponse.redirect(new URL(next,origin));
}
