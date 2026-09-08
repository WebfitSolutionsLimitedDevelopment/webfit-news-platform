import styles from './AnimatedMastheadLogo.module.css';

export function AnimatedMastheadLogo(){
  return <div className={styles.logo} aria-label="Webfit News">
    <span className={styles.webfitSlot} aria-hidden="true">
      <span className={styles.webfit}>WEBFIT</span>
    </span>
    <span className={styles.news} aria-hidden="true">
      <i>N</i><i>E</i><i>W</i><i>S</i>
    </span>
  </div>;
}
