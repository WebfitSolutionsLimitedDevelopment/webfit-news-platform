import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { visaDefinitions } from '@/lib/immigration';
import { immigrationCategoryPages, type ImmigrationCategoryPageConfig } from '@/lib/immigration-category-pages';
import styles from '@/app/immigration/Immigration.module.css';

const SITE_URL = 'https://www.webfitnews.com';

export function VisaCategoryLanding({ config }: { config: ImmigrationCategoryPageConfig }) {
  const visas = visaDefinitions.filter((visa) => visa.category === config.category);
  const relatedPages = config.relatedSlugs
    .map((slug) => immigrationCategoryPages.find((page) => page.slug === slug))
    .filter((page): page is ImmigrationCategoryPageConfig => Boolean(page));
  const pageUrl = `${SITE_URL}/immigration/${config.slug}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: config.title,
        description: config.metaDescription,
        isPartOf: { '@type': 'WebSite', name: 'Webfit News', url: SITE_URL },
        about: { '@type': 'Thing', name: `${config.category} visas for New Zealand` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: visas.length,
          itemListElement: visas.map((visa, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: visa.name,
            url: `${SITE_URL}/immigration/${visa.slug}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Webfit News', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'New Zealand Visa Guide', item: `${SITE_URL}/immigration` },
          { '@type': 'ListItem', position: 3, name: config.label, item: pageUrl },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: config.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };

  return <>
    <SiteHeader />
    <main className={`shell ${styles.page}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav className={styles.breadcrumb} aria-label="Immigration breadcrumb">
        <Link href="/immigration">New Zealand Visa Guide</Link>
        <span aria-hidden="true">/</span>
        <span>{config.label}</span>
      </nav>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>Webfit News NZ Immigration Information</span>
        <h1>{config.title}</h1>
        <p className={styles.heroLead}>{config.intro}</p>
        <div className={styles.notice}>
          <strong>General information only.</strong> These pages do not assess your personal eligibility or recommend which visa to choose. Always confirm the current requirements with Immigration New Zealand before applying.
        </div>
      </section>

      <nav className={styles.jumpNav} aria-label={`${config.label} page sections`}>
        <span>On this page:</span>
        <a href="#visa-list">Visa list</a>
        <a href="#how-they-differ">How they differ</a>
        <a href="#common-questions">Common questions</a>
        <Link href="/category/immigration">NZ Immigration News</Link>
      </nav>

      <section id="how-they-differ" className={styles.sourcePanel}>
        <span className={styles.sectionLabel}>Category overview</span>
        <h2>{config.overviewTitle}</h2>
        <ul>
          {config.overview.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section id="visa-list" className={styles.category}>
        <div className={styles.categoryHeading}>
          <div>
            <span className={styles.sectionLabel}>{visas.length} current guides</span>
            <h2>{config.label} covered by Webfit News</h2>
            <p>Open any visa below for the latest Webfit News source check, official Immigration New Zealand link, extracted requirements and downloadable branded checklist.</p>
          </div>
          <Link className={styles.backTop} href="/immigration">All NZ visas →</Link>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.visaTable}>
            <thead>
              <tr>
                <th>New Zealand visa</th>
                <th>What it is generally for</th>
                <th>Guide</th>
                <th>Checklist</th>
              </tr>
            </thead>
            <tbody>
              {visas.map((visa) => <tr key={visa.slug}>
                <td data-label="Visa"><Link className={styles.visaName} href={`/immigration/${visa.slug}`}>{visa.name}</Link></td>
                <td data-label="What it is generally for"><Link className={styles.summaryLink} href={`/immigration/${visa.slug}`}>{visa.summary}</Link></td>
                <td data-label="Guide"><Link className={styles.openGuide} href={`/immigration/${visa.slug}`}>Read {visa.name} guide →</Link></td>
                <td data-label="Checklist"><a className={styles.downloadGuide} href={`/immigration/${visa.slug}/checklist.pdf`}>Download PDF ↓</a></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section id="common-questions" className={styles.contentGrid} aria-label={`${config.label} common questions`}>
        <div>
          {config.faq.map((item) => <section key={item.question} className={styles.panel}>
            <h2>{item.question}</h2>
            <p>{item.answer}</p>
          </section>)}
        </div>
        <aside>
          <section className={styles.panel}>
            <h2>Related New Zealand visa categories</h2>
            <div className={styles.questions}>
              {relatedPages.map((page) => <Link key={page.slug} className={styles.question} href={`/immigration/${page.slug}`}>{page.label}</Link>)}
            </div>
          </section>
          <section className={styles.panel}>
            <h2>Latest NZ immigration updates</h2>
            <p>Read Webfit News reporting on Immigration New Zealand announcements, visa settings, work rights and policy changes.</p>
            <Link className={styles.openGuide} href="/category/immigration">Read NZ Immigration News →</Link>
          </section>
          <section className={styles.panel}>
            <h2>Official source policy</h2>
            <p>Webfit News reorganises publicly available information for readability. Immigration New Zealand remains the authoritative source for eligibility, fees, evidence, conditions and application instructions.</p>
          </section>
        </aside>
      </section>

      <div className={styles.returnPanel}>
        <div>
          <strong>Need a different New Zealand visa category?</strong>
          <p>Return to the main NZ Visa Guide to browse work, student, visitor, residence and family pathways together.</p>
        </div>
        <Link className={styles.primary} href="/immigration">Browse all New Zealand visas →</Link>
      </div>

      <div className={styles.disclaimer}>
        <strong>Not immigration advice:</strong> This page is a general information index. It does not assess personal circumstances, recommend a visa, predict an outcome or tell you how to complete an application. Check the current official Immigration New Zealand requirements before making an immigration decision.
      </div>
    </main>
    <PublicFooter />
  </>;
}
