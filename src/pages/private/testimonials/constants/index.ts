import type {
  PhotoRequestStatus,
  TestimonialListParams,
  TestimonialStatus,
} from '@/types/api';

/** Backend default is 20; max is 100. */
export const TESTIMONIAL_LIST_LIMIT = 20;

/** Query-string keys for the queue — filtering and paging happen on the server. */
export const TESTIMONIAL_LIST_SEARCH_PARAMS = {
  TAB: 'tab',
  PHOTOS: 'photos',
  PAGE: 'page',
} as const;

export type TTestimonialTab =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'all'
  | 'photo-requests';

/** Pending first: new testimonials wait there for a decision. */
export const TESTIMONIAL_TABS: {
  value: TTestimonialTab;
  label: string;
  params: Pick<TestimonialListParams, 'status' | 'photoRequest'>;
}[] = [
  { value: 'pending', label: 'Pending', params: { status: 'PENDING' } },
  { value: 'approved', label: 'Approved', params: { status: 'APPROVED' } },
  { value: 'rejected', label: 'Rejected', params: { status: 'REJECTED' } },
  { value: 'all', label: 'All', params: {} },
  {
    value: 'photo-requests',
    label: 'Photo requests',
    params: { photoRequest: 'PENDING' },
  },
];

export const DEFAULT_TESTIMONIAL_TAB: TTestimonialTab = 'pending';

export const TESTIMONIAL_STATUS_BADGES = {
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
} as const satisfies Record<
  TestimonialStatus,
  { label: string; variant: 'warning' | 'success' | 'destructive' }
>;

export const PHOTO_REQUEST_LABELS: Record<PhotoRequestStatus, string> = {
  PENDING: 'Wants to change photos',
  APPROVED: 'Photo change allowed',
  DECLINED: 'Photo change declined',
};

/** Mirrors the backend's VALIDATION limits. */
export const TESTIMONIAL_LIMITS = {
  REJECTION_REASON_MAX: 300,
  PHOTO_REQUEST_NOTE_MAX: 300,
  MODERATE_MAX: 100,
} as const;

/** One click fills the reason — the author reads it, so keep it kind. */
export const REJECTION_REASON_PRESETS = [
  "It isn't about this piece",
  'It shares personal details like a phone number',
  'The language goes against our guidelines',
  "The photos don't show the piece",
  'It reads like an advert or spam',
] as const;
