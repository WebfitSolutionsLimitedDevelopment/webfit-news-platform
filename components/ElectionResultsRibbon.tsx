import Link from 'next/link';
import styles from './ElectionResultsRibbon.module.css';

const results = [
  { code: 'NAT', seats: 42, share: '29.2%', color: '#1688e5' },
  { code: 'LAB', seats: 36, share: '29.4%', color: '#dc3045' },
  { code: 'GRE', seats: 16, share: '13.3%', color: '#219a42' },
  { code: 'ACT', seats: 13, share: '10.9%', color: '#e51c85' },
  { code: 'NZF', seats: 12, share: '9.8%', color: '#929292' },
  { code: 'OPP', seats: 7, share: '6.0%', color: '#04b8c2' },
  { code: 'TPM', seats: 5, share: '0.6%', color: '#ae1010' },
];

const resultsUrl = 'https://poll.webfitnews.co.nz/results-2026';

export function ElectionResultsRibbon() {
  return (
    <section className={styles.ribbon} aria-label="Election 2026 preliminary results">
      <div className={styles.inner}>
        <nav className={styles.nav} aria-label="Election 2026 coverage">
          <a href={resultsUrl} className={styles.heading}><span aria-hidden="true" className={styles.headingIcon}>◉</span>Election 2026</a>
          <Link href="/category/politics">Full coverage</Link>
          <a href={resultsUrl}>Results</a>
          <a href={resultsUrl + '#candidate-races-title'}>Electorates</a>
        </nav>
        <div className={styles.resultsRow}>
          <div className={styles.resultsScroll} aria-label="Preliminary seats and party vote shares">
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
        <p className={styles.note}>Preliminary election snapshot, not live results</p>
      </div>
    </section>
  );
}
