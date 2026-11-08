import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Polls and 2026 Election Results | Webfit News',
  description: 'Explore Webfit News community polls, electorate sentiment and sourced New Zealand election results.',
  alternates: { canonical: 'https://webfitnews.com/poll' },
};

const sections = [
  { title: '2026 Election Results', description: 'Official election reporting and electorate-level results. These are not community poll votes.', href: 'https://poll.webfitnews.co.nz/results-2026', action: 'View election results' },
  { title: 'Coalition Pulse', description: 'Explore community preferences for parties and coalition combinations.', href: 'https://poll.webfitnews.co.nz/coalition-2026', action: 'Explore coalition polls' },
  { title: 'Electorate Polls', description: 'Browse community sentiment polls for New Zealand electorates.', href: 'https://poll.webfitnews.co.nz/electorates-2026', action: 'Browse electorate polls' },
  { title: 'All Community Polls', description: 'Find current and previous Webfit News community polls and their published results.', href: 'https://poll.webfitnews.co.nz/', action: 'Open polling platform' },
];

export default function PollHubPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ background: '#f7f7f8', color: '#171b23', minHeight: '70vh', padding: '48px 20px 76px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ color: '#8a1931', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12 }}>Webfit News · Community Pulse</p>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 60px)', lineHeight: 1.08, letterSpacing: '-0.04em', margin: '14px 0' }}>Polls, public opinion and election results</h1>
          <p style={{ maxWidth: 760, color: '#4b5563', fontSize: 18, lineHeight: 1.6 }}>Follow official election results alongside Webfit News community polling. Community responses are voluntary and are never presented as official election votes.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: 18, marginTop: 38 }}>
            {sections.map((section) => (
              <article key={section.title} style={{ border: '1px solid #e3e5e9', borderRadius: 14, background: '#fff', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 style={{ fontSize: 23, fontWeight: 800, margin: 0 }}>{section.title}</h2>
                <p style={{ color: '#4b5563', lineHeight: 1.55, flex: 1, margin: 0 }}>{section.description}</p>
                <a href={section.href} style={{ color: '#8a1931', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 4 }}>{section.action} ↗</a>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 30, fontSize: 14, color: '#626a77' }}>Voting and detailed results currently continue on our existing secure polling platform while the new Webfit News section is integrated.</p>
          <p style={{ marginTop: 14 }}><Link href="/" style={{ color: '#8a1931', fontWeight: 700 }}>← Back to Webfit News</Link></p>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
