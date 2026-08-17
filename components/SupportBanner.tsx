import Link from 'next/link';

export function SupportBanner(){
  return <div className="support-banner">
    <div className="shell support-banner-inner">
      <Link className="support-banner-cta" href="/support-us">Support Webfit News</Link>
      <p><strong>Independent journalism needs readers behind it.</strong> Help us keep Webfit News free, open and community focused.</p>
      <Link className="support-signin" href="/login">Sign in</Link>
    </div>
  </div>;
}
