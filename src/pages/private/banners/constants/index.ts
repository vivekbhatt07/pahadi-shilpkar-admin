import type { TBannerStatus } from '../types';

export const BANNER_FORM_FIELD_NAMES = {
  TITLE: 'title',
  SUBTITLE: 'subtitle',
  IMAGE: 'image',
  MOBILE_IMAGE: 'mobileImage',
  CTA_LABEL: 'ctaLabel',
  CTA_URL: 'ctaUrl',
  STARTS_AT: 'startsAt',
  ENDS_AT: 'endsAt',
  IS_ACTIVE: 'isActive',
} as const;

/** Mirrors the backend's VALIDATION.BANNER_* limits. */
export const BANNER_LIMITS = {
  TITLE_MAX: 80,
  SUBTITLE_MAX: 200,
  CTA_LABEL_MAX: 30,
  CTA_URL_MAX: 500,
  /** Reorder takes at most this many ids at once. */
  REORDER_MAX: 50,
} as const;

export const BANNER_STATUS_BADGES = {
  live: { label: 'Live', variant: 'success' },
  scheduled: { label: 'Scheduled', variant: 'accent' },
  ended: { label: 'Ended', variant: 'secondary' },
  hidden: { label: 'Hidden', variant: 'outline' },
} as const satisfies Record<
  TBannerStatus,
  { label: string; variant: 'success' | 'accent' | 'secondary' | 'outline' }
>;
