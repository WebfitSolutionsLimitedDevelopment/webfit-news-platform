import type { MetadataRoute } from 'next';

const SITE_URL = 'https://webfitnews.com';
const IMMIGRATION_SITE_URL = 'https://www.webfitnews.com';

export default function robots():MetadataRoute.Robots{
  return {
    rules:{userAgent:'*',allow:'/',disallow:['/admin/','/api/']},
    sitemap:[
      `${SITE_URL}/sitemap.xml`,
      `${IMMIGRATION_SITE_URL}/immigration/sitemap.xml`
    ]
  };
}
