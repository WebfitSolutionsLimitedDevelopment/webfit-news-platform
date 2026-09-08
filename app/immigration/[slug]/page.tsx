import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { ArticleAudioPlayer } from '@/components/ArticleAudioPlayer';
import { getVisaDefinition, getVisaSnapshot, visaDefinitions } from '@/lib/immigration';
import { getPracticalGuidance } from '@/lib/immigration-practical';
import styles from '../Immigration.module.css';

const SITE_URL = 'https://www.webfitnews.com';

export const revalidate = 21600;

export function generateStaticParams() {
  return visaDefinitions.map((visa) => ({ slug: visa.slug }));
}

function seoTitle(visaName: string) {
  return `${visaName} NZ | Requirements, Cost & Checklist | Webfit News`;
}

function seoDescription(visaName: string, summary: string) {
  return `${visaName} New Zealand guide: ${summary} Check current requirements, cost, processing information, documents and download a checklist linked to the official INZ source.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const visa = getVisaDefinition(slug);
  if (!visa) return {};
  const canonical = `${SITE_URL}/immigration/${visa.slug}`;
  const title = seoTitle(visa.name);
  const description = seoDescription(visa.name, visa.summary);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Webfit News',
      locale: 'en_NZ',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

function formatCheckedAt(value: string) {
  return new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Pacific/Auckland',
  }).format(new Date(value));
}

function safeDisplayItems(items: string[] | undefined) {
  if (!items?.length) return [];
  const blocked = /\{\{|\}\}|innerText|item\.|undefined|null|v-for|x-for|ng-|^step\s*\d+\b|submit your application|check your application status|log in to your account|visa labels and evisas/i;
  const malformed = /\b(?:on|in|at|from|to)\s+(?:a|an|the)\s+(?:by|with|to|from|in|on)\s+(?:a|an|the)?\b/i;
  const seen = new Set<string>();

  return items
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter((item) => item.length >= 8 && item.length <= 360)
    .filter((item) => !blocked.test(item) && !malformed.test(item))
    .filter((item) => {
      const key = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildFaq(visaName: string, summary: string, facts: Array<[string, string | undefined]>, officialUrl: string) {
  const factMap = new Map(facts);
  const length = factMap.get('Length of stay');
  const cost = factMap.get('Cost');
  const processing = factMap.get('Processing time');

  return [
    { question: `What is the ${visaName}?`, answer: summary },
    { question: `How long can I stay in New Zealand on the ${visaName}?`, answer: length ? `The latest source snapshot lists ${length}. Check the official Immigration New Zealand page because visa conditions can change.` : `The permitted stay depends on the current Immigration New Zealand rules for this visa. Check the official source linked on this page for the latest duration.` },
    { question: `How much does the ${visaName} cost?`, answer: cost ? `The latest source snapshot lists ${cost}. Fees can change, so confirm the current amount with Immigration New Zealand before applying.` : `The current fee should be confirmed on the official Immigration New Zealand page linked on this guide.` },
    { question: `How long does the ${visaName} take to process?`, answer: processing ? `The latest source snapshot lists ${processing}. Processing times are indicative and can change.` : `Processing times can vary. Use the official Immigration New Zealand page linked on this guide for the latest published processing information.` },
    { question: `Where can I check the latest official ${visaName} requirements?`, answer: `Use the official Immigration New Zealand source: ${officialUrl}. Webfit News reorganises the public information for convenience but does not replace the official source.` },
  ];
}

export default async function VisaGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const visa = getVisaDefinition(slug);
  if (!visa) notFound();

  const [snapshot, practical] = await Promise.all([
    getVisaSnapshot(slug),
    getPracticalGuidance(slug),
  ]);

  const applyRequirements = safeDisplayItems(snapshot?.applyRequirements);
  const visaLetsYou = safeDisplayItems(snapshot?.visaLetsYou);
  const documentGuidance = safeDisplayItems(snapshot?.documentGuidance);

  const facts: Array<[string, string | undefined]> = [
    ['Length of stay', snapshot?.lengthOfStay],
    ['Cost', snapshot?.cost],
    ['Processing time', snapshot?.processingTime],
    ['Residence option', snapshot?.residenceOption],
  ].filter(([, value]) => Boolean(value)) as Array<[string, string | undefined]>;

  const faq = buildFaq(visa.name, visa.summary, facts, visa.officialUrl);
  const relatedVisas = visaDefinitions
    .filter((item) => item.category === visa.category && item.slug !== visa.slug)
    .slice(0, 6);

  const canonical = `${SITE_URL}/immigration/${visa.slug}`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${visa.name} New Zealand Visa Guide`,
      description: visa.summary,
      url: canonical,
      isPartOf: { '@type': 'WebSite', name: 'Webfit News', url: SITE_URL },
      about: { '@type': 'Thing', name: visa.name },
      primaryImageOfPage: undefined,
      dateModified: snapshot?.checkedAt,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Webfit News', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'New Zealand Visa Guide', item: `${SITE_URL}/immigration` },
        { '@type': 'ListItem', position: 3, name: visa.name, item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ];

  const speechText = [
    visa.name,
    visa.summary,
    ...facts.map(([label, value]) => `${label}: ${value}`),
    ...(practical?.facts || []).map((fact) => `${fact.label}: ${fact.value}. ${fact.note || ''}`),
    applyRequirements.length ? `To apply, Immigration New Zealand currently lists: ${applyRequirements.join('. ')}` : '',
    visaLetsYou.length ? `This visa can allow: ${visaLetsYou.join('. ')}` : '',
    'This is general information, not immigration advice. Always confirm current requirements with Immigration New Zealand.',
  ].filter(Boolean).join('. ');

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      {structuredData.map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}/>) }

      <nav className={styles.breadcrumb} aria-label="New Zealand immigration navigation">
        <Link href="/immigration">← New Zealand Visa Guide</Link>
        <span aria-hidden="true">/</span>
        <span>{visa.name}</span>
      </nav>

      <div className={styles.visaHero}>
        <div>
          <span className={styles.eyebrow}>New Zealand {visa.category.toLowerCase()} visa</span>
          <h1>{visa.name} New Zealand Guide</h1>
          <p>{visa.summary}</p>
          <div className={styles.questions}>
            {visa.keyQuestions.map((question) => <span key={question} className={styles.question}>{question}</span>)}
          </div>
        </div>
        <aside className={styles.sourceBadge}>
          <div className={snapshot?.sourceOk ? styles.sourceOk : styles.sourceWarn}>
            {snapshot?.sourceOk ? '✓ Official INZ source checked' : 'Source check unavailable'}
          </div>
          <div>Last checked: {snapshot ? formatCheckedAt(snapshot.checkedAt) : 'Not available'}</div>
          {snapshot?.sourceHash ? <div>Source version: {snapshot.sourceHash}</div> : null}
        </aside>
      </div>

      <ArticleAudioPlayer text={speechText}/>

      {facts.length ? <section className={styles.facts} aria-label={`${visa.name} key facts`}>
        {facts.map(([label, value]) => <div key={label} className={styles.fact}><span>{label}</span><strong>{value}</strong></div>)}
      </section> : null}

      {practical ? <section className={styles.practicalSection} aria-label={practical.title}>
        <div className={styles.practicalHeading}>
          <div>
            <span className={styles.sectionLabel}>Practical NZ visa information</span>
            <h2>{practical.title}</h2>
            <p>{practical.intro}</p>
          </div>
          <div className={practical.sourceOk ? styles.sourceOk : styles.sourceWarn}>
            {practical.sourceOk ? `✓ Official sources checked ${formatCheckedAt(practical.checkedAt)}` : 'Official practical-source refresh unavailable'}
          </div>
        </div>
        {practical.facts.length ? <div className={styles.practicalGrid}>
          {practical.facts.map((fact) => <article className={styles.practicalCard} key={fact.label}>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
            {fact.note ? <p>{fact.note}</p> : null}
            <a href={fact.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a>
          </article>)}
        </div> : <p>Please use the official government links on this page while this source check is unavailable.</p>}
        {slug === 'fee-paying-student-visa' ? <div className={styles.pathwayLink}>
          <strong>Finished or finishing your study?</strong>
          <span>See what the current Post Study Work Visa can allow after an eligible New Zealand qualification.</span>
          <Link href="/immigration/post-study-work-visa">Read the New Zealand Post Study Work Visa guide →</Link>
        </div> : null}
      </section> : null}

      <div className={styles.actions}>
        <a className={styles.primary} href={visa.officialUrl} target="_blank" rel="noreferrer">View official Immigration New Zealand page</a>
        <a className={styles.secondary} href={`/immigration/${slug}/checklist.pdf`}>Download {visa.name} PDF checklist</a>
        <Link className={styles.secondary} href="/immigration">Browse all NZ visas</Link>
        <Link className={styles.secondary} href="/category/immigration">NZ immigration news</Link>
      </div>

      <div className={styles.checklistNote}>
        <strong>Latest {visa.name} checklist:</strong> The PDF is generated from the latest Immigration New Zealand source snapshot used by this guide and includes Webfit News branding, source details and the general-information disclaimer. Download a fresh copy whenever you need one.
      </div>

      <div className={styles.contentGrid}>
        <div>
          <section className={styles.panel}>
            <h2>{visa.name} requirements: who can apply?</h2>
            {applyRequirements.length ? <ul>{applyRequirements.map((item) => <li key={item}>{item}</li>)}</ul> : <p>We could not safely extract this section during the latest source check. Please use the official Immigration New Zealand link above.</p>}
          </section>

          <section className={styles.panel}>
            <h2>What the {visa.name} lets you do</h2>
            {visaLetsYou.length ? <ul>{visaLetsYou.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Check the official Immigration New Zealand page for the current visa conditions.</p>}
          </section>

          <section className={styles.panel}>
            <h2>{visa.name} documents and evidence</h2>
            {documentGuidance.length ? <ul>{documentGuidance.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Document requirements vary by visa and circumstances. Use the official Immigration New Zealand page for the current evidence requirements. The PDF checklist on this page includes the information that could be safely extracted during the latest source check.</p>}
          </section>

          <section className={styles.panel} aria-labelledby="visa-faq-heading">
            <span className={styles.sectionLabel}>Common NZ visa questions</span>
            <h2 id="visa-faq-heading">{visa.name} FAQ</h2>
            {faq.map((item) => <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>)}
          </section>

          {relatedVisas.length ? <section className={styles.panel}>
            <span className={styles.sectionLabel}>Related New Zealand visas</span>
            <h2>Other {visa.category.toLowerCase()} visa guides</h2>
            <ul>
              {relatedVisas.map((item) => <li key={item.slug}><Link href={`/immigration/${item.slug}`}>{item.name} New Zealand guide</Link></li>)}
            </ul>
          </section> : null}
        </div>

        <aside>
          <section className={styles.panel}>
            <h2>Official Immigration New Zealand source</h2>
            <p>This guide is organised from Immigration New Zealand information. Webfit News does not replace the official application or eligibility process.</p>
            <p className={styles.officialLink}><a href={visa.officialUrl} target="_blank" rel="noreferrer">{visa.officialUrl}</a></p>
          </section>

          <section className={styles.panel}>
            <h2>How this NZ visa page stays updated</h2>
            <p>Webfit News re-checks the official visa page at least every six hours. When Immigration New Zealand changes the source page, the cached source is refreshed and the information shown here is re-extracted.</p>
            <p>If the source cannot be read reliably, we show a warning rather than invent or retain a potentially misleading extracted value.</p>
          </section>
        </aside>
      </div>

      <div className={styles.returnPanel}>
        <div>
          <strong>Looking for a different New Zealand visa?</strong>
          <p>Return to the main NZ Visa Guide to browse work, study, visitor, residence and family visa information or download another visa checklist.</p>
        </div>
        <Link className={styles.primary} href="/immigration">← Browse all New Zealand visas</Link>
      </div>

      <div className={styles.disclaimer}>
        <strong>Not immigration advice:</strong> This page provides general, publicly available information for convenience. It does not assess your circumstances, recommend a visa, predict an outcome, or tell you how to answer an application. Requirements can vary by applicant and can change. Before making an immigration decision or submitting an application, check the current official Immigration New Zealand requirements. If you need advice about your personal circumstances, use an appropriately licensed or exempt immigration adviser.
      </div>
    </main>
    <PublicFooter/>
  </>;
}
