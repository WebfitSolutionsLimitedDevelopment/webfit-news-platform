import Link from 'next/link';

const worldLinks = [
  ['/world/weather', 'World Weather'],
  ['/world/public-holidays', 'World Public Holidays'],
  ['/world/visa-immigration', 'World Visa & Immigration'],
  ['/world/currency-converter', 'World Currency Converter'],
  ['/world/gold-price', 'Gold Price Today'],
  ['/world/time', 'World Time'],
  ['/world/major-sports', 'World Cup & Major Sports'],
  ['/world/travel-requirements', 'International Travel Requirements'],
  ['/world/ai-technology', 'AI & Technology'],
  ['/world/news', 'World News'],
] as const;

export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <aside style={{maxWidth:1180,margin:'0 auto 48px',padding:'0 20px'}} aria-label="Explore World Guides">
        <div style={{borderTop:'1px solid #e5e7eb',paddingTop:22}}>
          <h2 style={{fontSize:20,margin:'0 0 12px'}}>Explore more World Guides</h2>
          <nav style={{display:'flex',flexWrap:'wrap',gap:'10px 18px',lineHeight:1.5}}>
            <Link href="/world">World Guides home</Link>
            {worldLinks.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
        </div>
      </aside>
    </>
  );
}
