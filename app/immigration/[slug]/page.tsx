import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { ArticleAudioPlayer } from '@/components/ArticleAudioPlayer';
import { getVisaDefinition, getVisaSnapshot, visaDefinitions } from '@/lib/immigration';
import styles from '../Immigration.module.css';

export const revalidate = 21600;

export function generateStaticParams() {
  return visaDefinitions.map((visa) => ({ slug: visa.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const visa = getVisaDefinition(slug);
  if (!visa) return {};
  return {
    title: `${visa.name} Guide | Webfit News`,
    description: `${visa.summary} Current information organised from Immigration New Zealand with an official source link and printable checklist.`,
  };
}

function formatCheckedAt(value: string) {
  return new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Pacific/Auckland',
  }).format(new Date(value));
}

export default async function VisaGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const visa = getVisaDefinition(slug);
  if (!visa) notFound();

  const snapshot = await getVisaSnapshot(slug);
  const facts = [
    ['Length of stay', snapshot?.lengthOfStay],
    ['Cost', snapshot?.cost],
    ['Processing time', snapshot?.processingTime],
    ['Residence option', snapshot?.residenceOption],
  ].filter(([, value]) => Boolean(value));

  const speechText = [
    visa.name,
    visa.summary,
    ...facts.map(([label, value]) => `${label}: ${value}`),
    snapshot?.applyRequirements.length ? `To apply, Immigration New Zealand currently lists: ${snapshot.applyRequirements.join('. ')}` : '',
    snapshot?.visaLetsYou.length ? `This visa can allow: ${snapshot.visaLetsYou.join('. ')}` : '',
    'This is general information, not immigration advice. Always confirm current requirements with Immigration New Zealand.',
  ].filter(Boolean).join('. ');

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <div className={styles.visaHero}>
        <div>
          <span className={styles.eyebrow}>{visa.category} visa guide</span>
          <h1>{visa.name}</h1>
          <p>{visa.summary}</p>
          <div className={styles.questions}>
            {visa.keyQuestions.map((question) => <span key={question} className={styles.question}>{question}</span>)}
          </div>
        </div>
        <aside className={styles.sourceBadge}>
          <div className={snapshot?.sourceOk ? styles.sourceOk : styles.sourceWarn}>
            {snapshot?.sourceOk ? '✓ Official source checked' : 'Source check unavailable'}
          </div>
          <div>Last checked: {snapshot ? formatCheckedAt(snapshot.checkedAt) : 'Not available'}</div>
          {snapshot?.sourceHash ? <div>Source version: {snapshot.sourceHash}</div> : null}
        </aside>
      </div>

      <ArticleAudioPlayer text={speechText}/>

      {facts.length ? <section className={styles.facts} aria-label="Visa facts">
        {facts.map(([label, value]) => <div key={label} className={styles.fact}><span>{label}</span><strong>{value}</strong></div>)}
      </section> : null}

      <div className={styles.actions}>
        <a className={styles.primary} href={visa.officialUrl} target="_blank" rel="noreferrer">View official INZ page</a>
        <a className={styles.secondary} href={`/immigration/${slug}/checklist.pdf`}>Download PDF checklist</a>
        <Link className={styles.secondary} href="/immigration">All visa guides</Link>
        <Link className={styles.secondary} href="/category/immigration">Immigration news</Link>
      </div>

      <div className={styles.contentGrid}>
        <div>
          <section className={styles.panel}>
            <h2>Who can apply</h2>
            {snapshot?.applyRequirements.length ? <ul>{snapshot.applyRequirements.map((item) => <li key={item}>{item}</li>)}</ul> : <p>We could not safely extract this section during the latest source check. Please use the official Immigration New Zealand link above.</p>}
          </section>

          <section className={styles.panel}>
            <h2>What this visa lets you do</h2>
            {snapshot?.visaLetsYou.length ? <ul>{snapshot.visaLetsYou.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Check the official Immigration New Zealand page for the current visa conditions.</p>}
          </section>

          <section className={styles.panel}>
            <h2>Documents and evidence</h2>
            {snapshot?.documentGuidance.length ? <ul>{snapshot.documentGuidance.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Document requirements vary by visa and circumstances. Use the official Immigration New Zealand page for the current evidence requirements. The PDF checklist on this page includes the information that could be safely extracted during the latest source check.</p>}
          </section>
        </div>

        <aside>
          <section className={styles.panel}>
            <h2>Official source</h2>
            <p>This guide is organised from Immigration New Zealand information. Webfit News does not replace the official application or eligibility process.</p>
            <p className={styles.officialLink}><a href={visa.officialUrl} target="_blank" rel="noreferrer">{visa.officialUrl}</a></p>
          </section>

          <section className={styles.panel}>
            <h2>How updates work</h2>
            <p>Webfit News re-checks the official visa page at least every six hours. When Immigration New Zealand changes the source page, the cached source is refreshed and the information shown here is re-extracted.</p>
            <p>If the source cannot be read reliably, we show a warning rather than invent or retain a potentially misleading extracted value.</p>
          </section>
        </aside>
      </div>

      <div className={styles.disclaimer}>
        <strong>Not immigration advice:</strong> This page provides general, publicly available information for convenience. It does not assess your circumstances, recommend a visa, predict an outcome, or tell you how to answer an application. Requirements can vary by applicant and can change. Before making an immigration decision or submitting an application, check the current official Immigration New Zealand requirements. If you need advice about your personal circumstances, use an appropriately licensed or exempt immigration adviser.
      </div>
    </main>
    <PublicFooter/>
  </>;
}
