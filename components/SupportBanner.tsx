import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';

export async function SupportBanner(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const readerName=
    user?.user_metadata?.full_name||
    user?.user_metadata?.name||
    user?.email?.split('@')[0]||
    'Reader';

  return <div className="support-banner">
    <div className="shell support-banner-inner">
      <Link className="support-banner-cta" href="/support-us">Support Webfit News</Link>
      <p><strong>Independent journalism needs readers behind it.</strong> Help us keep Webfit News free, open and community focused.</p>
      {user?
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{fontSize:'12px',fontWeight:800,whiteSpace:'nowrap'}}>{readerName}</span>
          <form action="/auth/signout" method="post">
            <button className="support-signin" type="submit" style={{border:0,cursor:'pointer',font:'inherit'}}>Sign out</button>
          </form>
        </div>
      :
        <Link className="support-signin" href="/login">Sign in</Link>
      }
    </div>
  </div>;
}
