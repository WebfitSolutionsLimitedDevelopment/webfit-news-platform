import styles from './ArticleEnd.module.css';

const LABELS: [string, string, string][] = [
  ['facebook', 'Facebook Page', 'facebook'],
  ['facebook_profile', 'Facebook Profile', 'facebook'],
  ['instagram', 'Instagram', 'instagram'],
  ['youtube', 'YouTube', 'youtube'],
  ['linkedin', 'LinkedIn', 'linkedin'],
  ['x', 'X', 'x'],
  ['tiktok', 'TikTok', 'tiktok'],
];

/** "Follow Webfit News" links, read from Admin → Settings → Social media, plus an email link to the office. */
export function ArticleFollow({ social, contactEmail, storyTitle }: { social: Record<string, string>; contactEmail?: string; storyTitle: string }) {
  const items = LABELS.filter(([key]) => /^https?:\/\//.test(social?.[key] || ''));
  if (!items.length && !contactEmail) return null;
  return (
    <section className={styles.block} aria-label="Follow Webfit News">
      <h2 className={styles.heading}>Follow Webfit News</h2>
      <div className={styles.row}>
        {items.map(([key, label, cls]) => <a key={key} className={`${styles.btn} ${styles[cls] || ''}`} href={social[key]} target="_blank" rel="noopener noreferrer">{label}</a>)}
        {contactEmail ? <a className={`${styles.btn} ${styles.email}`} href={`mailto:${contactEmail}?subject=${encodeURIComponent(`About: ${storyTitle}`)}`}>Email our office</a> : null}
      </div>
    </section>
  );
}
