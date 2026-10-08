import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { SubscribeForm } from './SubscribeForm';
import styles from './subscribe.module.css';

export const metadata: Metadata = {
  title: { absolute: `Get the e-paper by email | ${SITE_NAME}` },
  description: 'Get the free Webfit News e-paper in your inbox twice a week: the Midweek and Weekend editions, as soon as each one is out.',
  alternates: { canonical: absoluteUrl('/subscribe') },
};

const STATUS: Record<string, { cls: string; text: string }> = {
  confirmed: { cls: styles.ok, text: 'You’re in. The next Webfit News e-paper will land in your inbox as soon as it’s out.' },
  expired: { cls: styles.bad, text: 'That confirmation link has expired or isn’t valid. Enter your email below and we’ll send a fresh one.' },
  error: { cls: styles.bad, text: 'Something went wrong confirming your email. Please try again below.' },
};

export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const notice = status ? STATUS[status] : undefined;
  return <>
    <SiteHeader/>
    <main className="static-page">
      <span className="article-kicker">E-paper by email</span>
      <h1>Get the Webfit News e-paper in your inbox</h1>
      <p className="standfirst">Free, twice a week. We email you when each Midweek and Weekend edition is out, with the top stories and a link to flip through every page.</p>
      {notice ? <div className={`${styles.notice} ${notice.cls}`} role="status">{notice.text}</div> : null}
      {status === 'confirmed' ? <p><Link href="/epaper">Read the latest e-paper →</Link></p> : <SubscribeForm/>}
    </main>
    <PublicFooter/>
  </>;
}
