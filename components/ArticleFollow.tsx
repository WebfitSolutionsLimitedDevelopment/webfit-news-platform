import styles from './ArticleEnd.module.css';
import { Icon, type IconName } from './SocialIcons';

const ITEMS: [string, string, IconName][] = [
  ['facebook', 'Webfit News on Facebook', 'facebook'],
  ['facebook_profile', 'Webfit News on Facebook (second page)', 'facebook'],
  ['instagram', 'Webfit News on Instagram', 'instagram'],
  ['youtube', 'Webfit News on YouTube', 'youtube'],
  ['linkedin', 'Webfit News on LinkedIn', 'linkedin'],
  ['x', 'Webfit News on X', 'x'],
  ['tiktok', 'Webfit News on TikTok', 'tiktok'],
];

/** Follow icons, read from Admin → Settings → Social media, plus an email link to the office. */
export function ArticleFollow({ social, contactEmail, storyTitle }: { social: Record<string, string>; contactEmail?: string; storyTitle: string }) {
  const items = ITEMS.filter(([key]) => /^https?:\/\//.test(social?.[key] || ''));
  if (!items.length && !contactEmail) return null;
  return (
    <div className={styles.line}>
      <span className={styles.lineLabel}>Follow</span>
      <div className={styles.icons}>
        {items.map(([key, label, icon]) => (
          <a key={key} className={`${styles.icon} ${styles[icon] || ''}`} href={social[key]} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><Icon name={icon} /></a>
        ))}
        {contactEmail ? <a className={`${styles.icon} ${styles.mail}`} href={`mailto:${contactEmail}?subject=${encodeURIComponent(`About: ${storyTitle}`)}`} aria-label="Email our office" title="Email our office"><Icon name="mail" /></a> : null}
      </div>
    </div>
  );
}

/** Share and Follow together in one tidy box. */
export function ArticleSocialBox({ children }: { children: React.ReactNode }) {
  return <section className={styles.socialBox} aria-label="Share and follow">{children}</section>;
}
