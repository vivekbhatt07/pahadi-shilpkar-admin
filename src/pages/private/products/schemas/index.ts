import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@/constants/messages/shared';
import {
  HEX_COLOR_REGEX,
  MEASUREMENT_REGEX,
  SKU_REGEX,
  SLUG_REGEX,
} from '@/constants/regex';
import {
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
  SHAPE_SIZES,
  SIZE_LABELS,
} from '../constants';

const { PRODUCT, URL, SLUG } = VALIDATION_MESSAGES;

const optionalUrl = (message: string = URL.INVALID) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === '' || z.url().safeParse(value).success,
      message,
    );

const optionalHttpUrl = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' ||
      (/^https?:\/\//.test(value) && z.url().safeParse(value).success),
    PRODUCT.PURCHASE_LINK_URL_INVALID,
  );

const specificationSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, PRODUCT.SPEC_LABEL_REQUIRED)
    .max(PRODUCT_LIMITS.SPEC_LABEL_MAX, PRODUCT.SPEC_LABEL_MAX),
  value: z
    .string()
    .trim()
    .min(1, PRODUCT.SPEC_VALUE_REQUIRED)
    .max(PRODUCT_LIMITS.SPEC_VALUE_MAX, PRODUCT.SPEC_VALUE_MAX),
});

const colorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, PRODUCT.COLOR_NAME_REQUIRED)
    .max(PRODUCT_LIMITS.COLOR_NAME_MAX, PRODUCT.COLOR_NAME_MAX),
  /** Null = no swatch. */
  hex: z.string().regex(HEX_COLOR_REGEX, PRODUCT.COLOR_HEX_INVALID).nullable(),
});

const colorsSchema = z
  .array(colorSchema)
  .max(PRODUCT_LIMITS.COLORS_MAX, PRODUCT.COLORS_MAX)
  // "Red" and "red " are the same colour — flag the repeat, not the first.
  .superRefine((colors, ctx) => {
    const seen = new Set<string>();
    colors.forEach((color, index) => {
      const key = color.name.trim().toLowerCase();
      if (!key) return;
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'name'],
          message: PRODUCT.COLOR_NAME_DUPLICATE,
        });
      }
      seen.add(key);
    });
  });

const isValidSize = (size: number) =>
  size > 0 &&
  size <= PRODUCT_LIMITS.MEASUREMENT_MAX &&
  MEASUREMENT_REGEX.test(String(size));

/**
 * `shape: null` = not measured. Only the sizes the shape uses are checked —
 * values left over from switching shapes are dropped on save, so they can't
 * block it.
 */
const measurementsSchema = z
  .object({
    shape: z.enum(['RECTANGULAR', 'ROUND', 'OVAL', 'IRREGULAR']).nullable(),
    unit: z.enum(['MM', 'CM', 'M', 'IN', 'FT']),
    length: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    diameter: z.number().nullable(),
    note: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.MEASUREMENT_NOTE_MAX, PRODUCT.MEASUREMENT_NOTE_MAX),
  })
  .superRefine((measurements, ctx) => {
    const { shape } = measurements;
    if (shape === null) return;

    const { sizes, required } = SHAPE_SIZES[shape];
    sizes.forEach((size) => {
      const value = measurements[size];
      if (value === null) {
        if (required.includes(size)) {
          ctx.addIssue({
            code: 'custom',
            path: [size],
            message: `${SIZE_LABELS[size]} is required for ${shape.toLowerCase()} pieces`,
          });
        }
        return;
      }
      if (!isValidSize(value)) {
        ctx.addIssue({
          code: 'custom',
          path: [size],
          message: PRODUCT.MEASUREMENT_SIZE_INVALID,
        });
      }
    });

    if (
      shape === 'IRREGULAR' &&
      sizes.every((size) => measurements[size] === null)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: [],
        message: PRODUCT.MEASUREMENT_AT_LEAST_ONE,
      });
    }
  });

/** Shared with the combo form. */
export const purchaseLinkSchema = z.object({
  platform: z.enum([
    'AMAZON',
    'FLIPKART',
    'MEESHO',
    'ETSY',
    'INSTAGRAM',
    'FACEBOOK',
    'WEBSITE',
    'OTHER',
  ]),
  label: z
    .string()
    .trim()
    .max(
      PRODUCT_LIMITS.PURCHASE_LINK_LABEL_MAX,
      PRODUCT.PURCHASE_LINK_LABEL_MAX,
    ),
  url: optionalHttpUrl.refine(
    (value) => value !== '',
    PRODUCT.PURCHASE_LINK_URL_REQUIRED,
  ),
});

export const productFormSchema = z
  .object({
    [PRODUCT_FORM_FIELD_NAMES.NAME]: z
      .string()
      .trim()
      .min(1, PRODUCT.NAME_REQUIRED)
      .max(PRODUCT_LIMITS.NAME_MAX, PRODUCT.NAME_MAX),
    [PRODUCT_FORM_FIELD_NAMES.SLUG]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.SLUG_MAX, PRODUCT.SLUG_MAX)
      .refine((value) => value === '' || SLUG_REGEX.test(value), SLUG.INVALID),
    [PRODUCT_FORM_FIELD_NAMES.SKU]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.SKU_MAX, PRODUCT.SKU_MAX)
      .refine(
        (value) => value === '' || SKU_REGEX.test(value),
        PRODUCT.SKU_INVALID,
      ),
    [PRODUCT_FORM_FIELD_NAMES.SHORT_DESCRIPTION]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.SHORT_DESCRIPTION_MAX, PRODUCT.SHORT_DESCRIPTION_MAX),
    [PRODUCT_FORM_FIELD_NAMES.DESCRIPTION]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.DESCRIPTION_MAX, PRODUCT.DESCRIPTION_MAX),
    [PRODUCT_FORM_FIELD_NAMES.HIGHLIGHTS]: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(PRODUCT_LIMITS.HIGHLIGHT_MAX, PRODUCT.HIGHLIGHT_MAX),
      )
      .max(PRODUCT_LIMITS.HIGHLIGHTS_MAX, PRODUCT.HIGHLIGHTS_MAX),
    [PRODUCT_FORM_FIELD_NAMES.PRICE]: z
      .number({ error: PRODUCT.PRICE_REQUIRED })
      .positive(PRODUCT.PRICE_POSITIVE),
    [PRODUCT_FORM_FIELD_NAMES.COMPARE_AT_PRICE]: z
      .number()
      .positive(PRODUCT.COMPARE_AT_PRICE_POSITIVE)
      .nullable(),
    [PRODUCT_FORM_FIELD_NAMES.IMAGES]: z
      .array(z.url(URL.INVALID))
      .max(PRODUCT_LIMITS.IMAGES_MAX, PRODUCT.IMAGES_MAX),
    [PRODUCT_FORM_FIELD_NAMES.VIDEO_URL]: optionalUrl(
      PRODUCT.VIDEO_URL_INVALID,
    ),
    [PRODUCT_FORM_FIELD_NAMES.MATERIAL]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.MATERIAL_MAX, PRODUCT.MATERIAL_MAX),
    [PRODUCT_FORM_FIELD_NAMES.COLORS]: colorsSchema,
    [PRODUCT_FORM_FIELD_NAMES.MEASUREMENTS]: measurementsSchema,
    [PRODUCT_FORM_FIELD_NAMES.LEGACY_DIMENSIONS]: z.string().nullable(),
    [PRODUCT_FORM_FIELD_NAMES.WEIGHT]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.WEIGHT_MAX, PRODUCT.WEIGHT_MAX),
    [PRODUCT_FORM_FIELD_NAMES.CARE_INSTRUCTIONS]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.CARE_INSTRUCTIONS_MAX, PRODUCT.CARE_INSTRUCTIONS_MAX),
    [PRODUCT_FORM_FIELD_NAMES.SPECIFICATIONS]: z
      .array(specificationSchema)
      .max(PRODUCT_LIMITS.SPECIFICATIONS_MAX, PRODUCT.SPECS_MAX),
    [PRODUCT_FORM_FIELD_NAMES.TAGS]: z
      .array(
        z.string().trim().min(1).max(PRODUCT_LIMITS.TAG_MAX, PRODUCT.TAG_MAX),
      )
      .max(PRODUCT_LIMITS.TAGS_MAX, PRODUCT.TAGS_MAX),
    [PRODUCT_FORM_FIELD_NAMES.STOCK]: z
      .number({ error: PRODUCT.STOCK_REQUIRED })
      .int(PRODUCT.STOCK_INTEGER)
      .min(0, PRODUCT.STOCK_MIN),
    [PRODUCT_FORM_FIELD_NAMES.AVAILABILITY]: z.enum([
      'IN_STOCK',
      'OUT_OF_STOCK',
      'MADE_TO_ORDER',
      'COMING_SOON',
    ]),
    [PRODUCT_FORM_FIELD_NAMES.IS_FEATURED]: z.boolean(),
    [PRODUCT_FORM_FIELD_NAMES.IS_BESTSELLER]: z.boolean(),
    [PRODUCT_FORM_FIELD_NAMES.IS_ACTIVE]: z.boolean(),
    [PRODUCT_FORM_FIELD_NAMES.WHATSAPP_MESSAGE]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.WHATSAPP_MESSAGE_MAX, PRODUCT.WHATSAPP_MESSAGE_MAX),
    [PRODUCT_FORM_FIELD_NAMES.PURCHASE_LINKS]: z
      .array(purchaseLinkSchema)
      .max(PRODUCT_LIMITS.PURCHASE_LINKS_MAX, PRODUCT.PURCHASE_LINKS_MAX),
    [PRODUCT_FORM_FIELD_NAMES.META_TITLE]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.META_TITLE_MAX, PRODUCT.META_TITLE_MAX),
    [PRODUCT_FORM_FIELD_NAMES.META_DESCRIPTION]: z
      .string()
      .trim()
      .max(PRODUCT_LIMITS.META_DESCRIPTION_MAX, PRODUCT.META_DESCRIPTION_MAX),
    [PRODUCT_FORM_FIELD_NAMES.CATEGORY_ID]: z
      .string()
      .min(1, PRODUCT.CATEGORY_REQUIRED)
      .pipe(z.uuid(PRODUCT.CATEGORY_REQUIRED)),
  })
  .refine(
    (data) => data.compareAtPrice === null || data.compareAtPrice > data.price,
    {
      message: PRODUCT.COMPARE_AT_PRICE_GREATER,
      path: [PRODUCT_FORM_FIELD_NAMES.COMPARE_AT_PRICE],
    },
  );
