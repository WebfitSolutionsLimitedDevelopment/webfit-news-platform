import Link from 'next/link';
import {getRelatedNzGuides} from '@/lib/nz-guide-catalog';
import styles from '@/components/UtilityGuide.module.css';

export function NzGuideRelatedLinks({current}:{current:string}){
  const related=getRelatedNzGuides(current,4);
  if(!related.length)return null;
  return <section className={styles.section} aria-labelledby="related-nz-guides">
    <div className={styles.sectionHeading}>
      <span className={styles.kicker}>Related NZ guides</span>
      <h2 id="related-nz-guides">More New Zealand calculators and guides</h2>
      <p>Continue with closely related Webfit News tools built around official New Zealand government information.</p>
    </div>
    <div className={styles.infoGrid}>
      {related.map(guide=><article key={guide.href}>
        <h3><Link href={guide.href}>{guide.shortTitle}</Link></h3>
        <p>{guide.description}</p>
        <Link className={styles.cta} href={guide.href}>Open {guide.shortTitle} →</Link>
      </article>)}
    </div>
  </section>;
}
