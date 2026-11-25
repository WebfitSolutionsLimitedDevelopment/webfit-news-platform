import type { Edition } from '@/lib/epaper';
import { absoluteUrl } from '@/lib/site';

/** The front-page share picture for an edition (app/epaper/share-card). ?v changes as the edition fills, so previews refresh. */
export function shareCard(edition: Edition) {
  return {
    url: absoluteUrl(`/epaper/share-card/${edition.key}?v=${edition.number}-${edition.storyCount}`),
    width: 1200, height: 630, type: 'image/jpeg',
    alt: `Webfit News e-paper No. ${edition.number}, front page`,
  };
}

/** Title and description shown under the picture in WhatsApp and Facebook. */
export function shareText(edition: Edition) {
  const lead = edition.sections[0]?.stories[0]?.title;
  return {
    title: `Webfit News e-paper No. ${edition.number} · ${edition.dateline}`,
    // No extra full stop when the headline already ends with ? ! or .
    description: `${lead ? `This week: ${lead}${/[?!.…]$/.test(lead) ? '' : '.'} ` : ''}${edition.storyCount} stories, free to read page by page.`,
  };
}
