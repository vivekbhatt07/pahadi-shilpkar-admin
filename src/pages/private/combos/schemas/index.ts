import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@/constants/messages/shared';
import { SLUG_REGEX } from '@/constants/regex';
import type { ComboProduct } from '@/types/api';
import { PRODUCT_LIMITS } from '../../products/constants';
import { purchaseLinkSchema } from '../../products/schemas';
import { COMBO_FORM_FIELD_NAMES, COMBO_LIMITS } from '../constants';

const { COMBO, PRODUCT, URL, SLUG } = VALIDATION_MESSAGES;

const comboItemSchema = z.object({
  productId: z.uuid(),
  quantity: z
    .number({ error: COMBO.QUANTITY_REQUIRED })
    .int(COMBO.QUANTITY_INTEGER)
    .min(1, COMBO.QUANTITY_RANGE)
    .max(COMBO_LIMITS.QUANTITY_MAX, COMBO.QUANTITY_RANGE),
  /** Snapshot for display only — never sent to the API. */
  product: z.custom<ComboProduct>(),
});

export const comboFormSchema = z.object({
  [COMBO_FORM_FIELD_NAMES.NAME]: z
    .string()
    .trim()
    .min(1, COMBO.NAME_REQUIRED)
    .max(PRODUCT_LIMITS.NAME_MAX, COMBO.NAME_MAX),
  [COMBO_FORM_FIELD_NAMES.SLUG]: z
    .string()
    .trim()
    .max(PRODUCT_LIMITS.SLUG_MAX, PRODUCT.SLUG_MAX)
    .refine((value) => value === '' || SLUG_REGEX.test(value), SLUG.INVALID),
  [COMBO_FORM_FIELD_NAMES.SHORT_DESCRIPTION]: z
    .string()
    .trim()
    .max(PRODUCT_LIMITS.SHORT_DESCRIPTION_MAX, PRODUCT.SHORT_DESCRIPTION_MAX),
  [COMBO_FORM_FIELD_NAMES.DESCRIPTION]: z
    .string()
    .trim()
    .max(PRODUCT_LIMITS.DESCRIPTION_MAX, PRODUCT.DESCRIPTION_MAX),
  [COMBO_FORM_FIELD_NAMES.PRICE]: z
    .number({ error: PRODUCT.PRICE_REQUIRED })
    .positive(PRODUCT.PRICE_POSITIVE),
  [COMBO_FORM_FIELD_NAMES.IMAGES]: z
    .array(z.url(URL.INVALID))
    .max(PRODUCT_LIMITS.IMAGES_MAX, PRODUCT.IMAGES_MAX),
  [COMBO_FORM_FIELD_NAMES.ITEMS]: z
    .array(comboItemSchema)
    .min(1, COMBO.ITEMS_REQUIRED)
    .max(COMBO_LIMITS.ITEMS_MAX, COMBO.ITEMS_MAX)
    .refine((items) => {
      const quantities = items.map((item) => item.quantity);
      // A bad quantity is reported on its own row.
      if (quantities.some((quantity) => !Number.isInteger(quantity))) {
        return true;
      }
      const units = quantities.reduce((sum, quantity) => sum + quantity, 0);
      return units >= COMBO_LIMITS.MIN_UNITS;
    }, COMBO.MIN_UNITS),
  [COMBO_FORM_FIELD_NAMES.IS_FEATURED]: z.boolean(),
  [COMBO_FORM_FIELD_NAMES.IS_ACTIVE]: z.boolean(),
  [COMBO_FORM_FIELD_NAMES.WHATSAPP_MESSAGE]: z
    .string()
    .trim()
    .max(PRODUCT_LIMITS.WHATSAPP_MESSAGE_MAX, PRODUCT.WHATSAPP_MESSAGE_MAX),
  [COMBO_FORM_FIELD_NAMES.PURCHASE_LINKS]: z
    .array(purchaseLinkSchema)
    .max(PRODUCT_LIMITS.PURCHASE_LINKS_MAX, PRODUCT.PURCHASE_LINKS_MAX),
  [COMBO_FORM_FIELD_NAMES.META_TITLE]: z
    .string()
    .trim()
    .max(PRODUCT_LIMITS.META_TITLE_MAX, PRODUCT.META_TITLE_MAX),
  [COMBO_FORM_FIELD_NAMES.META_DESCRIPTION]: z
    .string()
    .trim()
    .max(PRODUCT_LIMITS.META_DESCRIPTION_MAX, PRODUCT.META_DESCRIPTION_MAX),
});
