import Link from 'next/link';
export function BreakingStrip({stories}:{stories:any[]}){if(!stories.length)return null;return <div className="breaking-strip"><div className="shell breaking-inner"><strong>BREAKING</strong><div className="breaking-links">{stories.map(s=><Link key={s.id} href={`/${s.slug}/`}>{s.title}</Link>)}</div></div></div>}
