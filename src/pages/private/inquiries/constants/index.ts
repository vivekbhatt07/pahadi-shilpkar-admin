import type { InquiryStatus, InquiryType } from '@/types/api';

/** Backend default is 20; max is 100. */
export const INQUIRY_LIST_LIMIT = 20;

/** Query-string keys for the inbox — filtering and paging happen on the server. */
export const INQUIRY_LIST_SEARCH_PARAMS = {
  STATUS: 'status',
  TYPE: 'type',
  PAGE: 'page',
} as const;

/** Mirrors the backend's VALIDATION.INQUIRY_ADMIN_NOTE_MAX_LENGTH. */
export const INQUIRY_NOTE_MAX = 1000;

/** The storefront form asks "What's it about?" with the longer wording. */
export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  CUSTOM_ORDER: 'Custom piece',
  BULK_ORDER: 'Bulk or gifting',
  GENERAL: 'General',
};

export const INQUIRY_TYPES = Object.keys(INQUIRY_TYPE_LABELS) as InquiryType[];

export const INQUIRY_STATUS_BADGES = {
  NEW: { label: 'New', variant: 'accent' },
  IN_PROGRESS: { label: 'In progress', variant: 'warning' },
  CLOSED: { label: 'Closed', variant: 'secondary' },
} as const satisfies Record<
  InquiryStatus,
  { label: string; variant: 'accent' | 'warning' | 'secondary' }
>;

export const INQUIRY_STATUSES = Object.keys(
  INQUIRY_STATUS_BADGES,
) as InquiryStatus[];
