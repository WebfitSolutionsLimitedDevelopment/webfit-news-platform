import Link from 'next/link';
import styles from './ElectionResultsRibbon.module.css';

const results = [
  { code: 'NAT', seats: 40, share: '28.35%', color: '#1688e5' },
  { code: 'LAB', seats: 36, share: '29.88%', color: '#dc3045' },
  { code: 'GRE', seats: 17, share: '14.06%', color: '#219a42' },
  { code: 'ACT', seats: 13, share: '10.54%', color: '#e51c85' },
  { code: 'NZF', seats: 12, share: '9.60%', color: '#929292' },
  { code: 'OPP', seats: 7, share: '6.06%', color: '#04b8c2' },
  { code: 'TPM', seats: 5, share: '0.63%', color: '#ae1010' },
];

const resultsUrl = 'https://poll.webfitnews.co.nz/results-2026';

export function ElectionResultsRibbon() {
  return (
    <section className={styles.ribbon} aria-label="Election 2026 final results">
      <div className={styles.inner}>
        <nav className={styles.nav} aria-label="Election 2026 coverage">
          <a href={resultsUrl} className={styles.heading}><span aria-hidden="true" className={styles.headingIcon}>◉</span>Election 2026</a>
          <Link href="/category/politics">Full coverage</Link>
          <a href={resultsUrl}>Results</a>
          <a href={resultsUrl + '#candidate-races-title'}>Electorates</a>
        </nav>
        <div className={styles.resultsRow}>
          <div className={styles.resultsScroll} aria-label="Final seats and party vote shares">
            {results.map((party) => (
              <span className={styles.party} key={party.code}>
                <span className={styles.dot} style={{backgroundColor:party.color}} aria-hidden="true" />
                <strong>{party.code} {party.seats}</strong>
                <span className={styles.share}>{party.share}</span>
              </span>
            ))}
          </div>
          <a className={styles.fullResults} href={resultsUrl}>Full results <span aria-hidden="true">→</span></a>
        </div>
        <p className={styles.note}>Final election results · 27 November 2026</p>
      </div>
    </section>
  );
}
