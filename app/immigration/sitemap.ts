import { MetadataRoute } from 'next';
import { visaDefinitions } from '@/lib/immigration';

const SITE_URL = 'https://www.webfitnews.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${SITE_URL}/immigration`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/category/immigration`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...visaDefinitions.map((visa) => ({
      url: `${SITE_URL}/immigration/${visa.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
  ];
}
