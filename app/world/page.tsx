import Link from "next/link";

export const metadata = {
  title: "World Guides | Weather, Holidays, Visas, Currency, Gold & News | Webfit News",
  description:
    "Explore live and regularly refreshed world guides for weather, public holidays, visas, currency, gold prices, world time, major sports, travel requirements, AI, technology and world news.",
  alternates: { canonical: "/world" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "World Guides | Weather, Currency, Gold, Travel & News | Webfit News",
    description: "Live and regularly refreshed global guides, tools and world news from Webfit News.",
    url: "/world",
    siteName: "Webfit News",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Guides | Webfit News",
    description: "Live global weather, holidays, visas, currency, gold, time, travel, technology and world news.",
  },
};

const tools = [
  { href: "/world/weather", title: "World Weather", text: "Current conditions and 5-day forecasts for cities worldwide.", status: "Live" },
  { href: "/world/public-holidays", title: "World Public Holidays", text: "Country-by-country public holidays with upcoming and past status.", status: "Live" },
  { href: "/world/visa-immigration", title: "World Visa & Immigration", text: "Official government visa and immigration portals with freshness checks.", status: "Live" },
  { href: "/world/currency-converter", title: "World Currency Converter", text: "Major currency conversions using regularly refreshed ECB reference rates.", status: "Live" },
  { href: "/world/gold-price", title: "Gold Price Today", text: "Latest gold spot price per ounce and gram in major currencies.", status: "Live" },
  { href: "/world/time", title: "World Time", text: "Current local time across major cities and time zones with automatic daylight-saving handling.", status: "Live" },
  { href: "/world/major-sports", title: "World Cup & Major Sports", text: "Major international sports events with automatic status and official fixture/result links.", status: "Live" },
  { href: "/world/travel-requirements", title: "International Travel Requirements", text: "Official visa, entry, transit, passport and arrival-rule sources for major destinations.", status: "Live" },
  { href: "/world/ai-technology", title: "AI & Technology", text: "Major AI and technology themes, primary sources and global regulation resources.", status: "Live" },
  { href: "/world/news", title: "World News", text: "Latest international headlines from the Webfit News newsroom with automatic refresh.", status: "Live" },
];

export default function WorldPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "World Guides",
      url: "https://webfitnews.com/world",
      description: "Live and regularly refreshed world guides, utility pages and international news from Webfit News.",
      isPartOf: { "@type": "WebSite", name: "Webfit News", url: "https://webfitnews.com" },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.title,
          url: `https://webfitnews.com${tool.href}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://webfitnews.com/" },
        { "@type": "ListItem", position: 2, name: "World Guides", item: "https://webfitnews.com/world" },
      ],
    },
  ];

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 20px 64px" }}>
      {jsonLd.map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />)}
      <p style={{ fontSize: 14, marginBottom: 10 }}><Link href="/">Home</Link> / World Guides</p>
      <section style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.05, margin: 0 }}>World Guides</h1>
        <p style={{ fontSize: 18, maxWidth: 820, lineHeight: 1.6, marginTop: 14 }}>
          Live and regularly refreshed global information from Webfit News. Explore World Weather, Public Holidays, Visa & Immigration, Currency Converter, Gold Price Today, World Time, Major Sports, International Travel Requirements, AI & Technology and automatically refreshed World News.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 }} aria-label="World Guides">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href} style={{ color: "inherit", textDecoration: "none" }}>
            <article style={{ border: "1px solid #ddd", borderRadius: 14, padding: 20, height: "100%", background: "#fff" }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
                {tool.status}
              </div>
              <h2 style={{ fontSize: 22, margin: "0 0 10px" }}>{tool.title}</h2>
              <p style={{ margin: 0, lineHeight: 1.55 }}>{tool.text}</p>
            </article>
          </Link>
        ))}
      </section>
    </main>
  );
}
