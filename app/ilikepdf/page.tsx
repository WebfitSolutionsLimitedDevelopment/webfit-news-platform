import type { Metadata } from 'next';
import Link from 'next/link';
import PdfToolbox from './PdfToolbox';
import styles from './ilikepdf.module.css';

export const metadata: Metadata = {
  title: 'Free PDF Converter & PDF Tools Online | ILikePDF by Webfit News',
  description: 'Free online PDF tools to merge, split, compress and convert PDF files. Convert PDF to JPG, PNG, Word or text, and Word, JPG, PNG or text to PDF in your browser.',
  keywords: [
    'free PDF converter',
    'free PDF tools',
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
    'PDF page numbers',
    'watermark PDF',
    'online PDF converter',
  ],
  alternates: { canonical: '/ilikepdf' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'ILikePDF: Free PDF Converter & PDF Tools | Webfit News',
    description: 'Convert, merge, split and edit PDF files free in your browser with privacy-first Webfit News tools.',
    url: '/ilikepdf',
    type: 'website',
  },
};

const faq = [
  {
    q: 'Is ILikePDF free to use?',
    a: 'Yes. The PDF tools on this page are available without a paid account. Processing is designed to happen in your browser for the tools currently offered here.',
  },
  {
    q: 'Are my PDF or Word files uploaded to Webfit News?',
    a: 'The tools currently available on this page process files locally in your browser. Webfit News does not need to store those documents to complete these conversions.',
  },
  {
    q: 'Can I convert PDF to JPG for free?',
    a: 'Yes. Choose PDF to JPG, select a PDF and the tool renders the pages into JPG images, then packages them into a ZIP download.',
  },
  {
    q: 'Can I convert JPG or PNG images to PDF?',
    a: 'Yes. Select JPG / PNG to PDF and choose one or more images. The tool creates a PDF with one image per page.',
  },
  {
    q: 'Does PDF to Word preserve the exact layout?',
    a: 'Not always. The current PDF to Word converter is intended for text-based PDFs. Complex layouts, scanned pages, forms and tables may need manual cleanup after conversion.',
  },
  {
    q: 'How does PDF compression work?',
    a: 'The browser renders each page as a compressed image and rebuilds the PDF. This is useful for image-heavy documents, but it flattens searchable text, links and interactive form fields.',
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

export default function ILikePdfPage() {
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
    name: 'ILikePDF by Webfit News',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any modern web browser',
    url: 'https://webfitnews.com/ilikepdf',
    description: 'Free browser-based PDF converter and PDF utility tools from Webfit News.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NZD' },
    featureList: [
      'Merge PDF',
      'Split PDF',
      'Organize PDF',
      'Remove PDF pages',
      'Rotate PDF',
      'Add PDF page numbers',
      'Watermark PDF',
      'Compress PDF',
      'JPG and PNG to PDF',
      'PDF to JPG',
      'PDF to PNG',
      'PDF to text',
      'PDF to Word',
      'Word to PDF',
      'Word to JPG',
      'Text to PDF',
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://webfitnews.com/' },
      { '@type': 'ListItem', position: 2, name: 'ILikePDF', item: 'https://webfitnews.com/ilikepdf' },
    ],
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><span>ILikePDF</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.brand}>ILikePDF • A WEBFIT NEWS UTILITY</p>
        <h1>Free PDF converter and everyday PDF tools</h1>
        <p>Merge, split, compress and convert documents without sending your files to a third-party conversion queue. Pick a tool, process it in your browser and download the result.</p>
        <div className={styles.heroBadges} aria-label="Tool benefits">
          <span>Free to use</span><span>No account required</span><span>Browser processing</span><span>Mobile friendly</span>
        </div>
      </header>

      <PdfToolbox />

      <section className={styles.section}>
        <h2>One free PDF converter for common document jobs</h2>
        <p className={styles.sectionLead}>People usually need a PDF tool for one small job: combine two files, turn a PDF into JPG images, convert a Word document to PDF, remove a page, rotate a scan or shrink an oversized attachment. ILikePDF brings those high-use tasks together on one page instead of forcing you through multiple websites.</p>
        <div className={styles.featureGrid}>
          <article className={styles.featureCard}><h3>PDF conversion</h3><p>Convert PDF to JPG, PNG, Word or text. Create PDFs from Word documents, JPG, PNG and pasted text.</p></article>
          <article className={styles.featureCard}><h3>PDF organisation</h3><p>Merge files, split selected pages, remove pages, reorder pages, rotate documents and add page numbers.</p></article>
          <article className={styles.featureCard}><h3>PDF optimisation</h3><p>Compress image-heavy files and add a visible text watermark without creating an account.</p></article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Why process PDF files in your browser?</h2>
        <p className={styles.sectionLead}>Many online document tools upload files to a remote server before conversion. The tools available here are deliberately implemented in the browser so the source document stays on your device during processing. That also means performance depends on your device and very large files may take longer.</p>
      </section>

      <section className={styles.section}>
        <h2>More document tools being evaluated</h2>
        <p className={styles.sectionLead}>Some conversions need OCR, encryption support or a full Office-compatible rendering engine to produce reliable output. We will not label those as working until they genuinely work. These are the next tool categories under evaluation:</p>
        <div className={styles.roadmap}>{roadmap.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className={styles.section}>
        <h2>Free PDF tool FAQ</h2>
        <div className={styles.faq}>{faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
      </section>

      <p className={styles.disclaimer}><strong>Brand note:</strong> ILikePDF is a Webfit News utility. It is not affiliated with, endorsed by or operated by iLovePDF. Product names belonging to other companies remain the property of their respective owners.</p>
    </main>
  );
}
