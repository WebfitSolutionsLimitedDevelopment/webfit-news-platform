import Link from "next/link";
import SportsCalendar, { type SportsEvent } from "./SportsCalendar";
import styles from "./sports.module.css";

export const revalidate = 86400;

export const metadata = {
  title: "World Cup & Major Sports Calendar 2026–2028 | Webfit News",
  description:
    "Track major international sports events, World Cups and tournament dates, with automatic upcoming/live/completed status and links to official fixtures and results.",
  alternates: { canonical: "/world/major-sports" },
  openGraph: {
    title: "World Cup & Major Sports Calendar | Webfit News",
    description: "Major international sports dates, event status and official fixture/result sources.",
    url: "/world/major-sports",
    type: "website",
  },
};

const events: SportsEvent[] = [
  {
    name: "2026 Asian Games — Aichi-Nagoya",
    sport: "Multi-sport",
    location: "Aichi and Nagoya, Japan",
    start: "2026-09-19",
    end: "2026-10-04",
    dateLabel: "19 September – 4 October 2026",
    description: "Asia’s major multi-sport event, with 41 sports and athletes from across the region.",
    officialUrl: "https://www.aichi-nagoya2026.org/",
    officialLabel: "Official Asian Games site",
  },
  {
    name: "2026 Formula 1 World Championship",
    sport: "Motorsport",
    location: "Worldwide",
    start: "2026-03-06",
    end: "2026-12-06",
    dateLabel: "6 March – 6 December 2026",
    description: "The 2026 Formula 1 season runs across the global Grand Prix calendar. Use the official F1 schedule for race-by-race times and results.",
    officialUrl: "https://www.formula1.com/en/racing/2026",
    officialLabel: "Official F1 calendar",
  },
  {
    name: "FIFA World Cup 2026",
    sport: "Football",
    location: "Canada, Mexico and United States",
    start: "2026-06-11",
    end: "2026-07-19",
    dateLabel: "11 June – 19 July 2026",
    description: "The 48-team men’s FIFA World Cup featured 104 matches across 16 host cities in North America.",
    officialUrl: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026",
    officialLabel: "Official FIFA World Cup site",
  },
  {
    name: "Men’s Rugby World Cup 2027",
    sport: "Rugby",
    location: "Australia",
    start: "2027-10-01",
    end: "2027-11-13",
    dateLabel: "1 October – 13 November 2027",
    description: "The expanded 24-team Rugby World Cup will feature 52 matches across seven Australian host cities.",
    officialUrl: "https://www.rugbyworldcup.com/2027",
    officialLabel: "Official Rugby World Cup site",
  },
  {
    name: "Los Angeles 2028 Olympic Games",
    sport: "Multi-sport",
    location: "Los Angeles, United States",
    start: "2028-07-14",
    end: "2028-07-30",
    dateLabel: "14 – 30 July 2028",
    description: "The Summer Olympic Games return to Los Angeles, including cricket (T20), flag football and squash on the programme.",
    officialUrl: "https://la28.org/",
    officialLabel: "Official LA28 site",
  },
];

const officialSources = [
  { name: "Football — FIFA", href: "https://www.fifa.com/tournaments", text: "World Cup tournaments, official fixtures, results and competition news." },
  { name: "Cricket — ICC", href: "https://www.icc-cricket.com/tournaments", text: "ICC World Cups, Champions Trophy and official international tournament information." },
  { name: "Rugby — World Rugby", href: "https://www.world.rugby/tournaments", text: "Rugby World Cups and official international rugby competition information." },
  { name: "Formula 1", href: "https://www.formula1.com/en/racing/2026", text: "Official Grand Prix calendar, race weekends, results and standings." },
  { name: "Olympics", href: "https://www.olympics.com/", text: "Official Olympic schedules, sports, qualification and Games information." },
];

const faq = [
  {
    q: "Does this page publish live sports scores?",
    a: "Not currently. Webfit News links to official competition sources for fixtures, results and standings instead of republishing third-party live-score feeds with unclear media redistribution rights.",
  },
  {
    q: "How does the event status update?",
    a: "The page compares the current date with each event’s published start and end dates, so events automatically move between Upcoming, Happening now and Completed.",
  },
  {
    q: "Where should I confirm a fixture or result?",
    a: "Use the official federation or organiser link shown on each event or in the official sports sources section, especially when schedules may change.",
  },
];

export default function MajorSportsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "World Cup & Major Sports Calendar",
    url: "https://webfitnews.com/world/major-sports",
    description: "Major international sports event dates and official fixture/result sources.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: events.map((event, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: event.name,
      })),
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main className={styles.main}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <p className={styles.breadcrumb}><Link href="/">Home</Link> / <Link href="/world">World Guides</Link> / World Cup & Major Sports</p>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>World Guides · Sports</p>
        <h1>World Cup & Major Sports Calendar</h1>
        <p>
          Follow major international sports events without hunting across multiple websites. Event status updates automatically by date, while fixture, result and standings links take you to the official competition source.
        </p>
      </header>

      <SportsCalendar events={events} />

      <section className={styles.sources} aria-labelledby="official-sources-heading">
        <p className={styles.eyebrow}>Verified destinations</p>
        <h2 id="official-sources-heading">Official fixtures, results and standings</h2>
        <p className={styles.intro}>For live scores and schedule changes, these governing-body sources are the authoritative destination.</p>
        <div className={styles.sourceGrid}>
          {officialSources.map((source) => (
            <a key={source.name} className={styles.sourceCard} href={source.href} target="_blank" rel="noreferrer noopener">
              <strong>{source.name}</strong>
              <span>{source.text}</span>
              <b>Open official source ↗</b>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.note}>
        <h2>About sports data on Webfit News</h2>
        <p>
          Event dates are checked against official organisers. Sports schedules can still change because of venue, weather, operational or competition decisions, so always confirm match-specific details with the official source before travelling or purchasing tickets.
        </p>
      </section>

      <section className={styles.faq} aria-labelledby="sports-faq-heading">
        <h2 id="sports-faq-heading">Frequently asked questions</h2>
        {faq.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <nav className={styles.related} aria-label="Related World Guides">
        <Link href="/world">← All World Guides</Link>
        <Link href="/world/time">World Time</Link>
        <Link href="/world/weather">World Weather</Link>
        <Link href="/world/currency-converter">Currency Converter</Link>
      </nav>
    </main>
  );
}
