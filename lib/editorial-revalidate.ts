import { revalidatePath } from 'next/cache';

/**
 * Invalidate public newsroom routes after an editorial write.
 *
 * The site keeps ISR enabled for performance, but CMS writes should never
 * wait for the normal revalidation window before readers see a changed image,
 * headline, category or other story metadata.
 */
export function revalidateEditorialContent(...slugs: Array<string | null | undefined>) {
  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath('/rss.xml');
  revalidatePath('/category/[slug]', 'page');

  for (const raw of slugs) {
    const slug = raw?.trim();
    if (slug) revalidatePath(`/${slug}`);
  }
}
