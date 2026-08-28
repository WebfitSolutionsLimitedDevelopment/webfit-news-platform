import Link from 'next/link';

type EditorialTrustStripProps = {
  compact?: boolean;
};

export function EditorialTrustStrip({ compact = false }: EditorialTrustStripProps) {
  return (
    <aside className={compact ? 'editorial-trust editorial-trust-compact' : 'editorial-trust'} aria-label="Webfit News editorial standards">
      <div className="editorial-trust-copy">
        <strong>Independent journalism, accountable standards.</strong>
        <span>Webfit News follows published editorial, corrections and complaints processes.</span>
      </div>
      <div className="editorial-trust-links">
        <Link href="/editorial-policy">Editorial policy</Link>
        <Link href="/corrections">Corrections</Link>
        <Link href="/contact">Contact newsroom</Link>
      </div>
    </aside>
  );
}
