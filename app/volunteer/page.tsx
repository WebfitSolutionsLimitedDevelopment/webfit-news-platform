import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { agreementSections, agreementVersion, volunteerContact, volunteerLogo, volunteerPrivacyNotice } from '@/lib/volunteer-agreement';
import { VolunteerForm } from './VolunteerForm';
import styles from './volunteer.module.css';

export const metadata: Metadata = {
  title: 'Volunteer Media Agreement and NDA',
  description: 'Read and sign the Webfit News agreement for occasional volunteer media assignments.',
  alternates: { canonical: 'https://webfitnews.com/volunteer' },
  robots: { index: false, follow: true },
};

export default function VolunteerPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <header className={styles.hero}>
          <Image src={volunteerLogo} width={124} height={124} alt="Webfit News" preload />
          <div>
            <p className={styles.eyebrow}>Webfit News · Volunteer onboarding</p>
            <h1>Volunteer Media Agreement and NDA</h1>
            <p>Read the terms and sign before your first assignment. Your coordinator will confirm each approved event separately.</p>
          </div>
        </header>
        <div className={styles.layout}>
          <article className={styles.agreement} aria-labelledby="agreement-terms">
            <div className={styles.agreementHeading}>
              <h2 id="agreement-terms">Agreement terms</h2>
              <span>Version {agreementVersion}</span>
            </div>
            {agreementSections.map(({ title, paragraphs }) => (
              <section key={title}>
                <h3>{title}</h3>
                {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
            <p>Read our <Link href="/editorial-policy">editorial policy</Link> before covering an event.</p>
            <section>
              <h3>How we use your details</h3>
              <p id="volunteer-privacy">
                {volunteerPrivacyNotice}{' '}
                <a href={`mailto:${volunteerContact}`}>{volunteerContact}</a>{' · '}
                <Link href="/privacy-policy">Privacy policy</Link>
              </p>
            </section>
          </article>
          <div className={styles.formColumn}>
            <VolunteerForm />
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
