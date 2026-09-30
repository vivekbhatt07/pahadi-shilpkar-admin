import dayjs from 'dayjs';

import { isValidUrl } from '@/helpers/format';
import type { Banner, UpdateBannerPayload } from '@/types/api';

import type { TBannerFormData, TBannerStatus } from './types';

/**
 * The backend's rule: a storefront path ("/products?tag=diwali") or a full
 * http(s) URL — never a protocol-relative "//other.site".
 */
export const isBannerLink = (value: string) =>
  /^\/(?![/\\])/.test(value) || isValidUrl(value);

export const getBannerStatus = (banner: Banner, now: number): TBannerStatus => {
  if (!banner.isActive) return 'hidden';
  if (banner.startsAt && dayjs(banner.startsAt).valueOf() > now) {
    return 'scheduled';
  }
  if (banner.endsAt && dayjs(banner.endsAt).valueOf() <= now) return 'ended';
  return 'live';
};

const formatWhen = (iso: string, now: number) => {
  const date = dayjs(iso);
  return date.format(
    date.year() === dayjs(now).year() ? 'MMM D, h:mm A' : 'MMM D, YYYY, h:mm A',
  );
};

/** The part of the schedule that matters for the banner's status, or null. */
export const describeSchedule = (
  banner: Banner,
  status: TBannerStatus,
  now: number,
): string | null => {
  const starts = banner.startsAt && formatWhen(banner.startsAt, now);
  const ends = banner.endsAt && formatWhen(banner.endsAt, now);

  switch (status) {
    case 'scheduled':
      return ends ? `Starts ${starts} · ends ${ends}` : `Starts ${starts}`;
    case 'live':
      return ends ? `Ends ${ends}` : null;
    case 'ended':
      return `Ended ${ends}`;
    case 'hidden':
      if (starts && ends) return `${starts} – ${ends}`;
      if (starts) return `From ${starts}`;
      if (ends) return `Until ${ends}`;
      return null;
  }
};

const DATETIME_LOCAL_FORMAT = 'YYYY-MM-DDTHH:mm';

/** An ISO instant as a `datetime-local` value, in the admin's timezone. */
const toDateTimeLocal = (iso: string | null) =>
  iso ? dayjs(iso).format(DATETIME_LOCAL_FORMAT) : '';

/** A `datetime-local` value as an ISO instant; empty clears the date. */
const fromDateTimeLocal = (value: string) =>
  value ? dayjs(value).toISOString() : null;

export const toBannerFormData = (banner?: Banner | null): TBannerFormData => ({
  title: banner?.title ?? '',
  subtitle: banner?.subtitle ?? '',
  image: banner?.image ?? '',
  mobileImage: banner?.mobileImage ?? '',
  ctaLabel: banner?.ctaLabel ?? '',
  ctaUrl: banner?.ctaUrl ?? '',
  startsAt: toDateTimeLocal(banner?.startsAt ?? null),
  endsAt: toDateTimeLocal(banner?.endsAt ?? null),
  isActive: banner?.isActive ?? true,
});

/** Form values as API fields: empty text clears a field, dates become ISO. */
export const toBannerPayload = (
  data: Partial<TBannerFormData>,
): UpdateBannerPayload => ({
  ...(data.title !== undefined && { title: data.title }),
  ...(data.subtitle !== undefined && { subtitle: data.subtitle || null }),
  ...(data.image !== undefined && { image: data.image }),
  ...(data.mobileImage !== undefined && {
    mobileImage: data.mobileImage || null,
  }),
  ...(data.ctaLabel !== undefined && { ctaLabel: data.ctaLabel || null }),
  ...(data.ctaUrl !== undefined && { ctaUrl: data.ctaUrl || null }),
  ...(data.startsAt !== undefined && {
    startsAt: fromDateTimeLocal(data.startsAt),
  }),
  ...(data.endsAt !== undefined && { endsAt: fromDateTimeLocal(data.endsAt) }),
  ...(data.isActive !== undefined && { isActive: data.isActive }),
});
