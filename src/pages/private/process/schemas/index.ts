import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@/constants/messages/shared';
import { isValidUrl } from '@/helpers/format';

import {
  PROCESS_LIMITS,
  PROCESS_PAGE_FORM_FIELD_NAMES,
  PROCESS_STEP_FORM_FIELD_NAMES,
} from '../constants';

const { PROCESS, URL } = VALIDATION_MESSAGES;

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || isValidUrl(value), URL.INVALID);

export const processPageFormSchema = z.object({
  [PROCESS_PAGE_FORM_FIELD_NAMES.TITLE]: z
    .string()
    .trim()
    .max(PROCESS_LIMITS.TITLE_MAX, PROCESS.TITLE_MAX),
  [PROCESS_PAGE_FORM_FIELD_NAMES.INTRO]: z
    .string()
    .trim()
    .max(PROCESS_LIMITS.INTRO_MAX, PROCESS.INTRO_MAX),
  [PROCESS_PAGE_FORM_FIELD_NAMES.HERO_IMAGE]: optionalUrl,
  [PROCESS_PAGE_FORM_FIELD_NAMES.STATS]: z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .min(1, PROCESS.STAT_VALUE_REQUIRED)
          .max(PROCESS_LIMITS.STAT_VALUE_MAX, PROCESS.STAT_VALUE_MAX),
        label: z
          .string()
          .trim()
          .min(1, PROCESS.STAT_LABEL_REQUIRED)
          .max(PROCESS_LIMITS.STAT_LABEL_MAX, PROCESS.STAT_LABEL_MAX),
      }),
    )
    .max(PROCESS_LIMITS.STATS_MAX, PROCESS.STATS_MAX),
});

export const processStepFormSchema = z.object({
  [PROCESS_STEP_FORM_FIELD_NAMES.TITLE]: z
    .string()
    .trim()
    .min(1, PROCESS.STEP_TITLE_REQUIRED)
    .max(PROCESS_LIMITS.STEP_TITLE_MAX, PROCESS.STEP_TITLE_MAX),
  [PROCESS_STEP_FORM_FIELD_NAMES.DESCRIPTION]: z
    .string()
    .trim()
    .min(1, PROCESS.STEP_DESCRIPTION_REQUIRED)
    .max(PROCESS_LIMITS.STEP_DESCRIPTION_MAX, PROCESS.STEP_DESCRIPTION_MAX),
  [PROCESS_STEP_FORM_FIELD_NAMES.IMAGE]: optionalUrl,
  [PROCESS_STEP_FORM_FIELD_NAMES.VIDEO_URL]: optionalUrl.refine(
    (value) => value.length <= PROCESS_LIMITS.STEP_VIDEO_URL_MAX,
    PROCESS.STEP_VIDEO_MAX,
  ),
  [PROCESS_STEP_FORM_FIELD_NAMES.DURATION]: z
    .string()
    .trim()
    .max(PROCESS_LIMITS.STEP_DURATION_MAX, PROCESS.STEP_DURATION_MAX),
  [PROCESS_STEP_FORM_FIELD_NAMES.IS_ACTIVE]: z.boolean(),
});
