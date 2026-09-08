import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'New Zealand Immigration & Visa Information',
    template: '%s',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function ImmigrationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
