import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import ScamCheckForm from './ScamCheckForm';

export const metadata:Metadata={
  title:'Scam Check NZ | Check a Business, Website, Phone or NZBN',
  description:'Use Webfit News Scam Check to check a business name, NZBN, website, email or phone number against official New Zealand warning and business-register evidence.',
  keywords:['scam check nz','nz scam checker','business verification nz','check nz business','nzbn search','fma scam warning','website scam check nz','phone scam nz'],
  alternates:{canonical:'/scam-check'},
  robots:{index:true,follow:true},
  openGraph:{
    title:'Scam Check NZ | Webfit News',
    description:'Check a business, website, phone number, email address or NZBN using official New Zealand warning and registry evidence.',
    url:'/scam-check',
    type:'website',
  },
};

const faq:[string,string][]=[
  ['Does a clean result mean a business is safe?','No. A business or website can be fraudulent even if it does not appear in an official warning list. Always independently verify who you are dealing with before sending money or sensitive information.'],
  ['What does Webfit News check?','The checker looks for evidence in recent Financial Markets Authority warning material and, when the approved API credential is configured, queries public NZBN register data. It also links directly to the official sources for independent verification.'],
  ['Does an NZBN prove that a website or investment is genuine?','No. Scammers can misuse the identity or registration details of a genuine New Zealand business. Confirm that the website, phone number, email address and payment details actually belong to the registered entity.'],
  ['Does Webfit News save my search?','The Scam Check feature is designed not to store the value entered in its own database. The value is processed for the current check only.'],
  ['What should I do if I think I have found a scam?','Stop sending money or information, contact your bank promptly if payment details were shared, preserve screenshots and messages, and report the matter to the relevant official New Zealand agency.'],
];

export default function ScamCheckPage(){
  const structuredData={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'WebApplication',
        name:'Webfit News Scam Check NZ',
        url:'https://webfitnews.com/scam-check',
        applicationCategory:'UtilityApplication',
        operatingSystem:'Web',
        description:metadata.description,
      },
      {
        '@type':'FAQPage',
        mainEntity:faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}})),
      },
      {
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
          {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
          {'@type':'ListItem',position:3,name:'Scam Check NZ',item:'https://webfitnews.com/scam-check'},
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Webfit News NZ Scam Check</span>
          <h1>Check before you trust, pay or invest</h1>
          <p className={styles.lead}>Enter a business name, NZBN, website, email address or phone number. Webfit News checks available official New Zealand evidence and shows exactly what was found, without pretending that an absence of warnings means something is safe.</p>
        </div>
        <div className={styles.heroCard}>
          <span>Evidence first</span>
          <strong>No fake “safety score”</strong>
          <small>Official warnings and registry evidence are shown separately so you can make an informed decision.</small>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Free NZ verification tool</span>
          <h2>Scam Check NZ</h2>
          <p>Paste the exact detail you were given. For a website, use the domain or full URL. For a company, use its legal or trading name, or its 13-digit NZBN if you have it.</p>
        </div>
        <ScamCheckForm/>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Understand the result</span>
          <h2>What this checker can and cannot tell you</h2>
        </div>
        <div className={styles.infoGrid}>
          <article><h3>FMA warning evidence</h3><p>A match in Financial Markets Authority warning material is a serious signal. Read the original warning and verify the exact website, name and contact details involved.</p></article>
          <article><h3>NZBN registration</h3><p>An NZBN record confirms public registration information. It does not prove the person contacting you controls that business or that an investment, invoice or website is genuine.</p></article>
          <article><h3>Identity mismatch</h3><p>Be cautious when a real company name is paired with a different domain, email address, bank account or phone number. Identity cloning is a known scam technique.</p></article>
          <article><h3>No match is not “safe”</h3><p>Official warning databases cannot contain every scam. New scams can appear before authorities publish a warning, and scammers frequently change names and domains.</p></article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Before paying</span>
          <h2>Five checks worth doing</h2>
        </div>
        <div className={styles.infoGrid}>
          <article><h3>1. Verify the exact domain</h3><p>Look carefully for extra letters, hyphens, unusual domains or a website that differs from the organisation’s independently verified address.</p></article>
          <article><h3>2. Verify contact details</h3><p>Do not rely only on the phone number or email supplied in a message. Find official contact details independently and call the organisation yourself.</p></article>
          <article><h3>3. Be suspicious of urgency</h3><p>Pressure to pay immediately, secrecy, cryptocurrency transfers, gift cards or unexpected changes to bank details are reasons to stop and verify.</p></article>
          <article><h3>4. Check financial providers</h3><p>If somebody is offering investments or financial services, check the FMA and relevant New Zealand financial-service registration information before proceeding.</p></article>
          <article><h3>5. Protect payment details</h3><p>If you already sent money or disclosed banking credentials, contact your bank promptly rather than waiting to see what happens.</p></article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Official sources</span>
          <h2>Verify directly with New Zealand authorities</h2>
        </div>
        <div className={styles.infoGrid}>
          <article><h3>Financial Markets Authority</h3><p>Search warnings and alerts about suspicious investment and financial-service activity.</p><a href="https://www.fma.govt.nz/library/warnings-and-alerts/" target="_blank" rel="noopener noreferrer">Open FMA warnings ↗</a></article>
          <article><h3>NZBN Register</h3><p>Search public New Zealand Business Number information and compare the registered identity with the details you were given.</p><a href="https://www.nzbn.govt.nz/" target="_blank" rel="noopener noreferrer">Open NZBN Register ↗</a></article>
          <article><h3>Consumer Protection</h3><p>Read New Zealand scam guidance and steps for responding when you believe you have been targeted.</p><a href="https://www.consumerprotection.govt.nz/general-help/scamwatch" target="_blank" rel="noopener noreferrer">Open Scamwatch guidance ↗</a></article>
          <article><h3>Netsafe</h3><p>Get help with online scams, harmful digital communications and online-safety issues.</p><a href="https://netsafe.org.nz/" target="_blank" rel="noopener noreferrer">Open Netsafe ↗</a></article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ scam-check questions</h2></div>
        <div className={styles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div>
      </section>

      <aside className={styles.disclaimer}><strong>Important:</strong> Webfit News Scam Check is an evidence-checking and public-information tool, not a certification service, financial advice or a guarantee of legitimacy. Official warning lists are not exhaustive. When money or sensitive information is at risk, independently verify the organisation using contact details you obtained from a trusted source.</aside>
      <p><Link href="/nz-guides">← Back to NZ Guides</Link></p>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/>
  </>;
}
