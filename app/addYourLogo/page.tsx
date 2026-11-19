import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { logoStudioUser } from '@/lib/logo-studio';
import { DAILY_LOGO_LIMIT, LOGO_KEEP_DAYS } from '@/lib/logo-placement';
import LogoStudio from './LogoStudio';
import styles from './LogoStudio.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Add Your Logo to Photos, Free for NZ Community Groups | Webfit News',
  description: `Free tool for New Zealand non-profits and community groups: sign in with Google, upload your logo and up to ${DAILY_LOGO_LIMIT} photos a day, and download them with your logo added.`,
  alternates: { canonical: '/addYourLogo' },
  openGraph: { title: 'Add your logo to your photos, free', description: 'A free tool from Webfit News for community groups and non-profits.', url: '/addYourLogo', type: 'website' },
};

export default async function AddYourLogoPage() {
  const user = await logoStudioUser();
  return <>
    <SiteHeader cricketScores={false}/>
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Free for community groups and non-profits</p>
        <h1 className={styles.title}>Put your logo on your photos</h1>
        <p className={styles.lede}>
          Upload your organisation’s logo and your event photos, choose where the logo sits, and download
          them ready to share. No design software, no fee.
        </p>
        <ul className={styles.facts}>
          <li><b>{DAILY_LOGO_LIMIT}</b><span>photos a day</span></li>
          <li><b>{LOGO_KEEP_DAYS} days</b><span>to download them again</span></li>
          <li><b>Never published</b><span>we don’t publish or share them</span></li>
        </ul>
      </header>
      <LogoStudio signedIn={!!user} email={user?.email ?? null}/>
      <section className={styles.notes}>
        <h2>Good to know</h2>
        <p>You sign in with your Google account so your logo and photos are kept with your account. The {DAILY_LOGO_LIMIT}-a-day limit resets at midnight, New Zealand time. Photos are deleted automatically after {LOGO_KEEP_DAYS} days.</p>
        <p>Only upload photos your group took, or has permission to use. Webfit News does not publish or share anything you upload here.</p>
      </section>
    </main>
    <PublicFooter/>
  </>;
}
