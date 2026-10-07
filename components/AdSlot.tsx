import { getLiveAds } from '@/lib/ads';
import { AdUnit, type AdVariant } from './AdUnit';
import { AdSpotlight } from './AdSpotlight';

type Props = { slotKey: string; className?: string; variant?: AdVariant | 'spotlight' };

/**
 * Renders whatever is booked into a named ad position (see /admin/advertisements).
 * Renders nothing when the position is empty, so layouts never show blank boxes.
 */
export async function AdSlot({ slotKey, className = '', variant = 'banner' }: Props) {
  const ads = (await getLiveAds())[slotKey];
  if (!ads?.length) return null;
  if (variant === 'spotlight') return <AdSpotlight ads={ads}/>;
  return <AdUnit ads={ads} variant={variant} className={className}/>;
}

/** True when at least one ad is booked into the position. */
export async function hasLiveAd(slotKey: string) {
  return Boolean((await getLiveAds())[slotKey]?.length);
}
