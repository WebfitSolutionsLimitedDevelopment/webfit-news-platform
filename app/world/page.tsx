import Link from "next/link";

export const metadata = {
  title: "World | Weather, Holidays, Visas, Currency, Markets & More | Webfit News",
  description:
    "Explore live and regularly refreshed global information including weather, public holidays, visas, currency, gold prices, world time, sports, technology and world news.",
};

const tools = [
  { href: "/world/weather", title: "World Weather", text: "Current conditions and 5-day forecasts for cities worldwide.", status: "Live" },
  { href: "/world/public-holidays", title: "World Public Holidays", text: "Country-by-country public holidays with upcoming and past status.", status: "Live" },
  { href: "/world/visa-immigration", title: "World Visa & Immigration", text: "Official government visa and immigration portals with freshness checks.", status: "Live" },
  { href: "#", title: "World Currency Converter", text: "Latest exchange rates and currency conversion tools.", status: "Coming next" },
  { href: "#", title: "Gold Price Today", text: "Latest gold prices with major market references.", status: "Planned" },
  { href: "#", title: "World Time", text: "Current local time across major cities and time zones.", status: "Planned" },
  { href: "#", title: "World Cup & Major Sports", text: "Fixtures, scores and major international sporting events.", status: "Planned" },
  { href: "#", title: "International Travel Requirements", text: "Entry rules, documents and travel requirement updates.", status: "Planned" },
  { href: "#", title: "AI & Technology", text: "Latest major AI and technology developments from around the world.", status: "Planned" },
  { href: "#", title: "World News", text: "Latest important international news and developments.", status: "Planned" },
];

export default function WorldPage() {
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 20px 64px" }}>
      <p style={{ fontSize: 14, marginBottom: 10 }}><Link href="/">Home</Link> / World</p>
      <section style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.05, margin: 0 }}>World</h1>
        <p style={{ fontSize: 18, maxWidth: 780, lineHeight: 1.6, marginTop: 14 }}>
          Live and regularly refreshed global information from Webfit News. Each service is designed around a defined source, freshness window and fallback state so the page does not become stale.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 }}>
        {tools.map((tool) => {
          const active = tool.href !== "#";
          const card = (
            <article style={{ border: "1px solid #ddd", borderRadius: 14, padding: 20, height: "100%", background: "#fff" }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
                {tool.status}
              </div>
              <h2 style={{ fontSize: 22, margin: "0 0 10px" }}>{tool.title}</h2>
              <p style={{ margin: 0, lineHeight: 1.55 }}>{tool.text}</p>
            </article>
          );
          return active ? <Link key={tool.title} href={tool.href} style={{ color: "inherit", textDecoration: "none" }}>{card}</Link> : <div key={tool.title}>{card}</div>;
        })}
      </section>
    </main>
  );
}
