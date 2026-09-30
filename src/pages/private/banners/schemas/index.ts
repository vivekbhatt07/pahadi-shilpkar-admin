import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@/constants/messages/shared';
import { isValidUrl } from '@/helpers/format';
import { BANNER_FORM_FIELD_NAMES, BANNER_LIMITS } from '../constants';
import { isBannerLink } from '../helpers';

const { BANNER, URL } = VALIDATION_MESSAGES;
const {
  TITLE,
  SUBTITLE,
  IMAGE,
  MOBILE_IMAGE,
  CTA_LABEL,
  CTA_URL,
  STARTS_AT,
  ENDS_AT,
  IS_ACTIVE,
} = BANNER_FORM_FIELD_NAMES;

export const bannerFormSchema = z
  .object({
    [TITLE]: z
      .string()
      .trim()
      .min(1, BANNER.TITLE_REQUIRED)
      .max(BANNER_LIMITS.TITLE_MAX, BANNER.TITLE_MAX),
    [SUBTITLE]: z
      .string()
      .trim()
      .max(BANNER_LIMITS.SUBTITLE_MAX, BANNER.SUBTITLE_MAX),
    [IMAGE]: z
      .string()
      .trim()
      .min(1, BANNER.IMAGE_REQUIRED)
      .refine(isValidUrl, URL.INVALID),
    [MOBILE_IMAGE]: z
      .string()
      .trim()
      .refine((value) => value === '' || isValidUrl(value), URL.INVALID),
    [CTA_LABEL]: z
      .string()
      .trim()
      .max(BANNER_LIMITS.CTA_LABEL_MAX, BANNER.CTA_LABEL_MAX),
    [CTA_URL]: z
      .string()
      .trim()
      .max(BANNER_LIMITS.CTA_URL_MAX, BANNER.CTA_URL_MAX)
      .refine(
        (value) => value === '' || isBannerLink(value),
        BANNER.CTA_URL_INVALID,
      ),
    /** `datetime-local` values in the admin's timezone; empty = no limit. */
    [STARTS_AT]: z.string(),
    [ENDS_AT]: z.string(),
    [IS_ACTIVE]: z.boolean(),
  })
  .refine((data) => !data.ctaLabel || data.ctaUrl, {
    message: BANNER.CTA_URL_REQUIRED,
    path: [CTA_URL],
  })
  .refine(
    (data) =>
      !data.startsAt ||
      !data.endsAt ||
      new Date(data.endsAt) > new Date(data.startsAt),
    { message: BANNER.SCHEDULE_INVALID, path: [ENDS_AT] },
  );
