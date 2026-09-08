import Link from 'next/link';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { visaDefinitions, VisaCategory } from '@/lib/immigration';
import styles from './Immigration.module.css';

export const metadata: Metadata = {
  title: 'New Zealand Visa Information | Webfit News',
  description: 'Immigration New Zealand visa information organised into clear, practical guides with direct links to official sources.',
};

const categories: VisaCategory[] = ['Work', 'Study', 'Visit', 'Residence', 'Family'];

export default function ImmigrationHubPage() {
  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Webfit News Immigration Information</span>
        <h1>New Zealand visa information, without the wall of text.</h1>
        <p>
          We organise publicly available Immigration New Zealand information into short, practical pages. Each guide links back to the official source, is checked automatically for changes, and includes a printable PDF checklist.
        </p>
        <div className={styles.notice}>
          <strong>Important:</strong> This is general information, not immigration advice. Webfit News does not assess your personal eligibility or tell you which visa to apply for. Always confirm current requirements with Immigration New Zealand before applying.
        </div>
      </section>

      <section className={styles.utilityGrid} aria-label="Useful immigration information">
        <div className={styles.utility}><h3>Official information, reorganised</h3><p>Every visa page links directly to Immigration New Zealand so you can verify the full rule and apply through the official channel.</p></div>
        <div className={styles.utility}><h3>Automatically checked</h3><p>Official visa pages are re-fetched regularly. Each guide shows when its source was last checked.</p></div>
        <div className={styles.utility}><h3>Language and accessibility</h3><p>Use the Webfit News language selector and listen-aloud accessibility controls on visa information pages.</p></div>
      </section>

      {categories.map((category) => {
        const visas = visaDefinitions.filter((visa) => visa.category === category);
        if (!visas.length) return null;
        return <section key={category} className={styles.category}>
          <h2>{category} visas</h2>
          <div className={styles.grid}>
            {visas.map((visa) => <Link key={visa.slug} className={styles.card} href={`/immigration/${visa.slug}`}>
              <span>{visa.category}</span>
              <h3>{visa.name}</h3>
              <p>{visa.summary}</p>
              <b>Open visa guide →</b>
            </Link>)}
          </div>
        </section>;
      })}

      <section className={styles.category}>
        <h2>Immigration news and changes</h2>
        <div className={styles.panel}>
          <p>For policy announcements, visa rule changes and immigration news reported by Webfit News, visit the Immigration news section.</p>
          <Link className={styles.newsLink} href="/category/immigration">Read Immigration news →</Link>
        </div>
      </section>

      <div className={styles.disclaimer}>
        <strong>Information notice:</strong> Content on this section is based on publicly available information from Immigration New Zealand and other official New Zealand government sources where stated. It is provided for general informational convenience only. It is not tailored immigration advice, legal advice, or an assessment of eligibility. Immigration rules, fees, processing times and evidence requirements can change. The official Immigration New Zealand website remains the authoritative source.
      </div>
    </main>
    <PublicFooter/>
  </>;
}
