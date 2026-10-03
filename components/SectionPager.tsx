import Link from 'next/link';
import { sectionPath } from '@/lib/section';

/**
 * Newer / older links plus page numbers, so readers and Google can reach every
 * story in a section, not just the latest 60.
 */
export function SectionPager({ slug, page, totalPages }: { slug: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const numbers: number[] = [];
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n++) numbers.push(n);
  return <nav className="section-pager" aria-label="Section pages">
    {page > 1 ? <Link href={sectionPath(slug, page - 1)} rel="prev">Newer stories</Link> : <span/>}
    <div>
      {numbers[0] > 1 ? <><Link href={sectionPath(slug, 1)}>1</Link>{numbers[0] > 2 ? <span>…</span> : null}</> : null}
      {numbers.map(n => n === page
        ? <span key={n} aria-current="page">{n}</span>
        : <Link key={n} href={sectionPath(slug, n)}>{n}</Link>)}
      {numbers[numbers.length - 1] < totalPages ? <>{numbers[numbers.length - 1] < totalPages - 1 ? <span>…</span> : null}<Link href={sectionPath(slug, totalPages)}>{totalPages}</Link></> : null}
    </div>
    {page < totalPages ? <Link href={sectionPath(slug, page + 1)} rel="next">Older stories</Link> : <span/>}
  </nav>;
}
