import type { Metadata } from 'next';
import Link from 'next/link';
import PdfToolbox from '../ilikepdf/PdfToolbox';
import styles from '../ilikepdf/ilikepdf.module.css';

export const metadata: Metadata = {
  title: 'ILikeMyPdf – Free PDF Converter & PDF Tools Online | Webfit News',
  description: 'Use ILikeMyPdf by Webfit News for free PDF conversion and editing. Convert PDF to JPG, PNG, Word or text, convert Word/JPG/PNG to PDF, merge PDF, split PDF, compress PDF and more.',
  keywords: [
    'ILikeMyPdf',
    'free PDF converter',
    'free PDF tools',
    'online PDF converter',
    'PDF converter free',
    'convert PDF online free',
    'PDF to JPG',
    'JPG to PDF',
    'PDF to Word',
    'Word to PDF',
    'PDF to PNG',
    'PNG to PDF',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'rotate PDF',
    'remove PDF pages',
    'organize PDF pages',
    'PDF page numbers',
    'watermark PDF',
    'PDF to text',
    'Word to JPG',
  ],
  alternates: { canonical: '/ilikemypdf' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'ILikeMyPdf – Free PDF Converter & PDF Tools | Webfit News',
    description: 'Free PDF conversion, merge, split, compression and editing tools that run in your browser.',
    url: '/ilikemypdf',
    type: 'website',
  },
};

const faq = [
  {
    q: 'Is ILikeMyPdf free to use?',
    a: 'Yes. ILikeMyPdf provides free PDF tools without requiring a paid account for the tools currently available on this page.',
  },
  {
    q: 'Are my PDF or Word files uploaded to Webfit News?',
    a: 'The tools currently available on ILikeMyPdf process files locally in your browser. Webfit News does not need to store those documents to complete these conversions.',
  },
  {
    q: 'Can I convert PDF to JPG for free?',
    a: 'Yes. Choose PDF to JPG, select a PDF and ILikeMyPdf renders the pages into JPG images and packages them into a ZIP download.',
  },
  {
    q: 'Can I convert JPG or PNG images to PDF?',
    a: 'Yes. Select JPG / PNG to PDF and choose one or more images. The tool creates a PDF with one image per page.',
  },
  {
    q: 'Can I convert PDF to Word online?',
    a: 'Yes for text-based PDFs. Complex layouts, scanned pages, forms and tables may require manual cleanup after conversion.',
  },
  {
    q: 'Can I merge, split and compress PDFs for free?',
    a: 'Yes. ILikeMyPdf includes free tools to merge PDFs, split selected pages and compress image-heavy PDF files in your browser.',
  },
];

const roadmap = [
  'PDF to PowerPoint',
  'PowerPoint to PDF',
  'PDF to Excel',
  'Excel to PDF',
  'OCR PDF',
  'Protect PDF',
  'Unlock PDF',
  'Redact PDF',
  'Repair PDF',
  'PDF to PDF/A',
  'Compare PDFs',
  'HTML to PDF',
];

export default function ILikeMyPdfPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ILikeMyPdf by Webfit News',
    alternateName: 'ILikeMyPdf',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any modern web browser',
    url: 'https://webfitnews.com/ilikemypdf',
    description: 'Free browser-based PDF converter and PDF utility tools from Webfit News.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NZD' },
    featureList: [
      'Merge PDF', 'Split PDF', 'Organize PDF', 'Remove PDF pages', 'Rotate PDF',
      'Add PDF page numbers', 'Watermark PDF', 'Compress PDF', 'JPG and PNG to PDF',
      'PDF to JPG', 'PDF to PNG', 'PDF to text', 'PDF to Word', 'Word to PDF',
      'Word to JPG', 'Text to PDF',
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://webfitnews.com/' },
      { '@type': 'ListItem', position: 2, name: 'ILikeMyPdf', item: 'https://webfitnews.com/ilikemypdf' },
    ],
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><span>ILikeMyPdf</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.brand}>ILikeMyPdf • A WEBFIT NEWS UTILITY</p>
        <h1>Free PDF converter and everyday PDF tools</h1>
        <p>Convert, merge, split, compress and edit PDFs for free. ILikeMyPdf handles common document jobs directly in your browser, with no account required for the tools available here.</p>
        <div className={styles.heroBadges} aria-label="Tool benefits">
          <span>Free to use</span><span>No account required</span><span>Browser processing</span><span>Mobile friendly</span>
        </div>
      </header>

      <PdfToolbox />

      <section className={styles.section}>
        <h2>Free online PDF converter for everyday document jobs</h2>
        <p className={styles.sectionLead}>Need to convert PDF to JPG, turn JPG into PDF, convert PDF to Word, convert Word to PDF, merge PDFs, split pages or compress a large PDF? ILikeMyPdf puts these high-use PDF tools together on one free page so you can finish the job without jumping between different websites.</p>
        <div className={styles.featureGrid}>
          <article className={styles.featureCard}><h3>Convert PDF files</h3><p>Convert PDF to JPG, PNG, Word or text. Create PDFs from Word documents, JPG, PNG and pasted text.</p></article>
          <article className={styles.featureCard}><h3>Merge, split and organise PDF</h3><p>Merge multiple PDFs, split selected pages, remove pages, reorder pages, rotate documents and add page numbers.</p></article>
          <article className={styles.featureCard}><h3>Compress and watermark PDF</h3><p>Reduce image-heavy PDF file sizes and add a visible text watermark without creating an account.</p></article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Private browser-based PDF processing</h2>
        <p className={styles.sectionLead}>The tools currently available on ILikeMyPdf are designed to process source documents inside your browser instead of sending them to a remote conversion queue. Very large files can take longer because the work happens on your device.</p>
      </section>

      <section className={styles.section}>
        <h2>More free document tools being evaluated</h2>
        <p className={styles.sectionLead}>Some conversions need OCR, encryption support or a full Office-compatible rendering engine to produce reliable output. We will add those tools only when they work properly.</p>
        <div className={styles.roadmap}>{roadmap.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className={styles.section}>
        <h2>ILikeMyPdf free PDF tool FAQ</h2>
        <div className={styles.faq}>{faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
      </section>
    </main>
  );
}
