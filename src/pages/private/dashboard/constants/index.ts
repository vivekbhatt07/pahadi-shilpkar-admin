import type { JobType } from '@/types/api';

/**
 * Buy-click series colors, in fixed order: WhatsApp is slot 1 and sits on
 * the chart's baseline, marketplaces are slot 2. Both steps stay apart for
 * colorblind readers and clear 3:1 on the white and stone-900 card surfaces.
 */
export const CHANNEL_SWATCHES = {
  WHATSAPP: 'bg-emerald-600',
  MARKETPLACE: 'bg-sky-600',
} as const;

/**
 * What each background job does, and what its giving up left undone — for
 * the list of failed ones. A type the backend adds later shows as itself.
 */
export const JOB_DESCRIPTIONS: Record<
  JobType,
  { title: string; undone: string }
> = {
  VERIFICATION_EMAIL: {
    title: "A new account's verification email",
    undone: 'The shopper can still get it with "Resend" on the sign-in page.',
  },
  STOCK_ALERTS: {
    title: 'Back-in-stock emails',
    undone: "Shoppers waiting on a product weren't told it's back.",
  },
  INQUIRY_NOTIFICATION: {
    title: 'The new-inquiry email to the store',
    undone: 'The inquiry itself is saved — it’s in Inquiries.',
  },
  IMAGE_CLEANUP: {
    title: 'Deleting removed photos from Cloudinary',
    undone: 'They’re still stored — Photo storage lists them.',
  },
  ORPHAN_IMAGE_SWEEP: {
    title: 'The nightly check for unused photos',
    undone: 'Only that night’s — the next runs as usual.',
  },
  REJECTED_TESTIMONIAL_CLEANUP: {
    title: 'The nightly clear-out of old rejected reviews',
    undone: 'Only that night’s — the next runs as usual.',
  },
};
