import Link from 'next/link';
import styles from './ai.module.css';

export const revalidate = 21600;

export const metadata = {
  title: 'AI & Technology News, Trends and Official Resources | Webfit News',
  description: 'Follow major artificial intelligence and technology developments worldwide, with trusted primary sources, AI regulation resources and practical explainers.',
  alternates: { canonical: '/world/ai-technology' },
  openGraph: {
    title: 'AI & Technology | World Guides | Webfit News',
    description: 'Major AI and technology developments, official resources and regulation trackers from around the world.',
    url: '/world/ai-technology',
    type: 'website',
  },
};

const topics = [
  ['AI models & agents', 'New foundation models, reasoning systems, autonomous agents and multimodal AI are changing how people search, code, create and complete digital work.'],
  ['AI chips & infrastructure', 'GPUs, accelerators, data centres, cloud capacity, power demand and semiconductor supply are now central to the global AI race.'],
  ['AI regulation & safety', 'Governments are introducing rules covering transparency, high-risk systems, privacy, copyright, safety and accountability.'],
  ['Robotics & automation', 'AI is moving beyond software into robots, factories, vehicles, logistics and other physical-world systems.'],
  ['Cybersecurity', 'AI can strengthen detection and defence, while also increasing the speed and sophistication of phishing, fraud and cyber attacks.'],
  ['Consumer technology', 'Phones, computers, wearables, search engines and productivity software increasingly ship with AI features built in.'],
];

const primarySources = [
  { name: 'OpenAI', href: 'https://openai.com/news/', text: 'Official product, research, safety and company announcements.' },
  { name: 'Google AI', href: 'https://ai.google/', text: 'Google AI research, products and major AI initiatives.' },
  { name: 'Google DeepMind', href: 'https://deepmind.google/discover/blog/', text: 'Primary research and model announcements from Google DeepMind.' },
  { name: 'Anthropic', href: 'https://www.anthropic.com/news', text: 'Official Claude, research, policy and safety announcements.' },
  { name: 'Meta AI', href: 'https://ai.meta.com/blog/', text: 'Meta AI research, models and engineering updates.' },
  { name: 'NVIDIA', href: 'https://nvidianews.nvidia.com/', text: 'Official AI computing, GPU and infrastructure announcements.' },
  { name: 'Microsoft AI', href: 'https://blogs.microsoft.com/ai/', text: 'Microsoft AI product, infrastructure and policy updates.' },
  { name: 'Apple Machine Learning', href: 'https://machinelearning.apple.com/', text: 'Apple machine-learning research and technical publications.' },
];

const regulation = [
  { name: 'European Commission — AI Act', href: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', text: 'Official EU implementation information, timelines and guidance for the AI Act.' },
  { name: 'EUR-Lex — AI Act', href: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj', text: 'Official legal text and consolidated European Union legislation.' },
  { name: 'NIST AI Risk Management Framework', href: 'https://www.nist.gov/itl/ai-risk-management-framework', text: 'U.S. NIST resources for managing artificial-intelligence risks.' },
  { name: 'OECD AI', href: 'https://www.oecd.org/en/topics/artificial-intelligence.html', text: 'International AI policy, principles, indicators and governance resources.' },
];

const faq = [
  { q: 'How often is this AI and technology guide refreshed?', a: 'The page is configured to revalidate every six hours. Primary-source links remain the authoritative place to confirm product, research and regulatory announcements.' },
  { q: 'Why does Webfit News link to official AI company sources?', a: 'Fast-moving technology stories can change quickly. Primary sources help readers verify what a company actually announced before relying on commentary or social-media summaries.' },
  { q: 'What AI topics does this page cover?', a: 'The guide focuses on major AI models and agents, chips and infrastructure, regulation and safety, robotics, cybersecurity and consumer technology.' },
  { q: 'Is the EU AI Act already in effect?', a: 'The EU AI Act entered into force in 2024 and applies in stages. Most rules began applying from 2 August 2026, while some high-risk obligations have later application dates. Always check the European Commission or EUR-Lex for the current timetable.' },
];

export default function AiTechnologyPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
  };
  const pageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI & Technology',
    url: 'https://webfitnews.com/world/ai-technology',
    description: 'Major artificial intelligence and technology topics, official sources and regulation resources.',
  };

  return (
    <main className={styles.main}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className={styles.breadcrumb}><Link href="/">Home</Link> / <Link href="/world">World Guides</Link> / AI & Technology</p>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>World Guides · Technology</p>
        <h1>AI & Technology</h1>
        <p>Track the technologies reshaping business and everyday life — from AI models and autonomous agents to chips, robotics, cybersecurity and global AI regulation.</p>
        <div className={styles.freshness}><strong>Freshness:</strong> this guide is configured for a six-hour refresh cycle. For breaking announcements, use the linked primary sources.</div>
      </header>

      <section className={styles.section}>
        <p className={styles.eyebrow}>What to watch</p>
        <h2>Major AI and technology themes</h2>
        <div className={styles.topicGrid}>{topics.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.section}>
        <p className={styles.eyebrow}>Primary sources</p>
        <h2>Official AI and technology updates</h2>
        <p className={styles.intro}>Use these first-party sources to confirm major model releases, research claims, product changes and infrastructure announcements.</p>
        <div className={styles.sourceGrid}>{primarySources.map((source) => <a key={source.name} href={source.href} target="_blank" rel="noreferrer noopener"><strong>{source.name}</strong><span>{source.text}</span><b>Open official source ↗</b></a>)}</div>
      </section>

      <section className={styles.section}>
        <p className={styles.eyebrow}>Rules & governance</p>
        <h2>AI regulation and safety resources</h2>
        <p className={styles.intro}>AI regulation is evolving by jurisdiction. In the European Union, most AI Act rules began applying on 2 August 2026, with some high-risk requirements scheduled later.</p>
        <div className={styles.sourceGrid}>{regulation.map((source) => <a key={source.name} href={source.href} target="_blank" rel="noreferrer noopener"><strong>{source.name}</strong><span>{source.text}</span><b>Open official resource ↗</b></a>)}</div>
      </section>

      <section className={styles.explainer}>
        <h2>How to read fast-moving AI news</h2>
        <p>A benchmark win, product demo or company claim does not automatically mean a system performs better in every real-world task. Check the model version, test conditions, availability, pricing, safety limitations and independent evidence before drawing conclusions.</p>
        <p>For regulation, use the actual government or legislative source because implementation dates and obligations can change.</p>
      </section>

      <section className={styles.faq}>
        <h2>Frequently asked questions</h2>
        {faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
      </section>

      <nav className={styles.related} aria-label="Related World Guides">
        <Link href="/world">← All World Guides</Link>
        <Link href="/world/major-sports">Major Sports</Link>
        <Link href="/world/travel-requirements">Travel Requirements</Link>
        <Link href="/world/time">World Time</Link>
        <Link href="/world/currency-converter">Currency Converter</Link>
      </nav>
    </main>
  );
}
