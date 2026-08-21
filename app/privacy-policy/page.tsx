import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata={title:'Privacy Policy'};

export default function PrivacyPolicyPage(){
  return <>
    <SiteHeader/>
    <main className="static-page">
      <span className="article-kicker">Privacy</span>
      <h1>Privacy Policy</h1>
      <p className="standfirst">This policy explains how Webfit News handles information when readers use our website and related services.</p>

      <h2>Information we may process</h2>
      <p>Webfit News may process information that readers provide directly, such as account details, support or payment information, correspondence and information submitted through newsroom interactions. We may also receive technical information such as browser, device, page-view and usage data.</p>

      <h2>Analytics and advertising</h2>
      <p>We use services including Google Analytics to understand website usage and Google AdSense to support advertising. Those services may use cookies or similar technologies subject to their own policies and applicable consent requirements.</p>

      <h2>Payments</h2>
      <p>Reader contributions are processed by Stripe. Payment card details are handled by Stripe and are not intended to be stored directly by Webfit News.</p>

      <h2>How information is used</h2>
      <p>Information may be used to operate and secure the website, provide requested services, understand readership, administer reader accounts and contributions, communicate with readers, improve our journalism and meet legal or regulatory obligations.</p>

      <h2>Third-party services</h2>
      <p>The website may use third-party infrastructure and services for hosting, authentication, analytics, advertising, payments and media delivery. Information processed by those providers is also subject to their applicable privacy terms.</p>

      <h2>Your choices</h2>
      <p>You can manage browser cookie controls and may contact Webfit News about privacy-related questions through our <Link href="/contact">Contact</Link> page.</p>

      <p><small>Last updated: 17 August 2026.</small></p>
    </main>
    <PublicFooter/>
  </>;
}
