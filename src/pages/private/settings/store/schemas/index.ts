import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@/constants/messages/shared';
import { WHATSAPP_NUMBER_REGEX } from '@/constants/regex';
import {
  deliveryChargeSchema,
  deliveryFeeSchema,
} from '../../../products/schemas';
import {
  STORE_SETTINGS_FORM_FIELD_NAMES,
  STORE_SETTINGS_LIMITS,
} from '../constants';

const { SETTINGS, EMAIL, URL } = VALIDATION_MESSAGES;

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' ||
      (/^https?:\/\//.test(value) && z.url().safeParse(value).success),
    URL.INVALID,
  );

const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || z.email().safeParse(value).success,
    EMAIL.INVALID,
  );

export const storeSettingsFormSchema = z.object({
  [STORE_SETTINGS_FORM_FIELD_NAMES.WHATSAPP_NUMBER]: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || WHATSAPP_NUMBER_REGEX.test(value),
      SETTINGS.WHATSAPP_NUMBER_INVALID,
    ),
  [STORE_SETTINGS_FORM_FIELD_NAMES.WHATSAPP_MESSAGE_TEMPLATE]: z
    .string()
    .trim()
    .max(
      STORE_SETTINGS_LIMITS.WHATSAPP_MESSAGE_TEMPLATE_MAX,
      SETTINGS.TEMPLATE_MAX,
    ),
  [STORE_SETTINGS_FORM_FIELD_NAMES.DELIVERY_CHARGE]: deliveryChargeSchema,
  [STORE_SETTINGS_FORM_FIELD_NAMES.DELIVERY_FEE]: deliveryFeeSchema,
  [STORE_SETTINGS_FORM_FIELD_NAMES.CONTACT_EMAIL]: optionalEmail,
  [STORE_SETTINGS_FORM_FIELD_NAMES.CONTACT_PHONE]: z
    .string()
    .trim()
    .max(STORE_SETTINGS_LIMITS.CONTACT_PHONE_MAX, SETTINGS.CONTACT_PHONE_MAX),
  [STORE_SETTINGS_FORM_FIELD_NAMES.INSTAGRAM_URL]: optionalUrl,
  [STORE_SETTINGS_FORM_FIELD_NAMES.FACEBOOK_URL]: optionalUrl,
  [STORE_SETTINGS_FORM_FIELD_NAMES.YOUTUBE_URL]: optionalUrl,
});
