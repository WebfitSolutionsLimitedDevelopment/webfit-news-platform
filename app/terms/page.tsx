import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata={title:'Terms of Use'};

export default function TermsPage(){
  return <>
    <SiteHeader/>
    <main className="static-page">
      <span className="article-kicker">Terms</span>
      <h1>Terms of Use</h1>
      <p className="standfirst">These terms apply when you access or use the Webfit News website and its public reader services.</p>

      <h2>Editorial content</h2>
      <p>Webfit News publishes journalism, analysis, opinion, community reporting and other editorial material. Content is provided for general information and may be updated, corrected or removed as editorial circumstances require.</p>

      <h2>Acceptable use</h2>
      <p>You may access and share links to Webfit News content for lawful personal and informational purposes. You must not misuse the website, interfere with its operation, attempt unauthorised access, or reproduce substantial portions of our content in a way that infringes applicable rights.</p>

      <h2>Reader accounts</h2>
      <p>Where reader sign-in is available, you are responsible for using your account lawfully and for protecting access to your sign-in method.</p>

      <h2>Reader contributions</h2>
      <p>Support payments are voluntary contributions to Webfit News. Unless a payment screen expressly states otherwise, support contributions are one-off payments rather than recurring subscriptions.</p>

      <h2>External services and links</h2>
      <p>Webfit News may link to third-party websites and use third-party providers for authentication, payments, analytics, advertising and other services. We do not control external websites and their terms may apply separately.</p>

      <h2>Corrections and complaints</h2>
      <p>Questions about published material can be raised through our <Link href="/corrections">Corrections</Link> or <Link href="/contact">Contact</Link> pages.</p>

      <p><small>Last updated: 17 August 2026.</small></p>
    </main>
    <PublicFooter/>
  </>;
}
