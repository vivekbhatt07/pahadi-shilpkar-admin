import type {
  MeasurementUnit,
  ProductAvailability,
  ProductShape,
  ProductSize,
  ProductSort,
  PurchaseLinkPlatform,
} from '@/types/api';

export const PRODUCT_FORM_FIELD_NAMES = {
  NAME: 'name',
  SLUG: 'slug',
  SKU: 'sku',
  SHORT_DESCRIPTION: 'shortDescription',
  DESCRIPTION: 'description',
  HIGHLIGHTS: 'highlights',
  PRICE: 'price',
  COMPARE_AT_PRICE: 'compareAtPrice',
  IMAGES: 'images',
  VIDEO_URL: 'videoUrl',
  MATERIAL: 'material',
  COLORS: 'colors',
  MEASUREMENTS: 'measurements',
  /** Read-only: an unmeasured product's old free text; cleared to retire it. */
  LEGACY_DIMENSIONS: 'legacyDimensions',
  WEIGHT: 'weight',
  CARE_INSTRUCTIONS: 'careInstructions',
  SPECIFICATIONS: 'specifications',
  TAGS: 'tags',
  STOCK: 'stock',
  AVAILABILITY: 'availability',
  IS_FEATURED: 'isFeatured',
  IS_BESTSELLER: 'isBestseller',
  IS_ACTIVE: 'isActive',
  WHATSAPP_MESSAGE: 'whatsappMessage',
  PURCHASE_LINKS: 'purchaseLinks',
  META_TITLE: 'metaTitle',
  META_DESCRIPTION: 'metaDescription',
  CATEGORY_ID: 'categoryId',
} as const;

export const PRODUCT_LIMITS = {
  NAME_MAX: 100,
  SLUG_MAX: 120,
  SKU_MAX: 50,
  SHORT_DESCRIPTION_MAX: 200,
  DESCRIPTION_MAX: 2000,
  HIGHLIGHTS_MAX: 10,
  HIGHLIGHT_MAX: 150,
  IMAGES_MAX: 10,
  MATERIAL_MAX: 100,
  COLORS_MAX: 10,
  COLOR_NAME_MAX: 30,
  MEASUREMENT_MAX: 10000,
  MEASUREMENT_NOTE_MAX: 100,
  WEIGHT_MAX: 50,
  CARE_INSTRUCTIONS_MAX: 1000,
  SPECIFICATIONS_MAX: 20,
  SPEC_LABEL_MAX: 50,
  SPEC_VALUE_MAX: 200,
  TAGS_MAX: 20,
  TAG_MAX: 30,
  WHATSAPP_MESSAGE_MAX: 500,
  PURCHASE_LINKS_MAX: 10,
  PURCHASE_LINK_LABEL_MAX: 50,
  META_TITLE_MAX: 70,
  META_DESCRIPTION_MAX: 160,
} as const;

export const AVAILABILITY_OPTIONS: {
  value: ProductAvailability;
  label: string;
}[] = [
  { value: 'IN_STOCK', label: 'In stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
  { value: 'MADE_TO_ORDER', label: 'Made to order' },
  { value: 'COMING_SOON', label: 'Coming soon' },
];

export const PURCHASE_LINK_PLATFORM_OPTIONS: {
  value: PurchaseLinkPlatform;
  label: string;
}[] = [
  { value: 'AMAZON', label: 'Amazon' },
  { value: 'FLIPKART', label: 'Flipkart' },
  { value: 'MEESHO', label: 'Meesho' },
  { value: 'ETSY', label: 'Etsy' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'OTHER', label: 'Other' },
];

export const SHAPE_OPTIONS: {
  value: ProductShape;
  label: string;
  /** What the shape is for — shown under the picker. */
  examples: string;
}[] = [
  {
    value: 'RECTANGULAR',
    label: 'Rectangular / square',
    examples: 'Boxes, frames, trays, shawls, cushion covers',
  },
  {
    value: 'ROUND',
    label: 'Round',
    examples: 'Plates, thalis, bowls, diyas, vases, round wall art',
  },
  {
    value: 'OVAL',
    label: 'Oval',
    examples: 'Oval trays, baskets, frames',
  },
  {
    value: 'IRREGULAR',
    label: 'Irregular',
    examples:
      'Idols, figurines, spoons, anything else — measure the space it takes up',
  },
];

export const SIZE_LABELS: Record<ProductSize, string> = {
  length: 'Length',
  width: 'Width',
  height: 'Height',
  diameter: 'Diameter',
};

/**
 * The sizes each shape is measured by, in display order, and the ones it
 * can't do without. An irregular piece needs at least one, but no particular
 * one. Mirrors the backend.
 */
export const SHAPE_SIZES: Record<
  ProductShape,
  { sizes: readonly ProductSize[]; required: readonly ProductSize[] }
> = {
  RECTANGULAR: {
    sizes: ['length', 'width', 'height'],
    required: ['length', 'width'],
  },
  ROUND: { sizes: ['diameter', 'height'], required: ['diameter'] },
  OVAL: { sizes: ['length', 'width', 'height'], required: ['length', 'width'] },
  IRREGULAR: { sizes: ['length', 'width', 'height'], required: [] },
};

export const DEFAULT_MEASUREMENT_UNIT: MeasurementUnit = 'CM';

export const UNIT_OPTIONS: {
  value: MeasurementUnit;
  label: string;
  name: string;
}[] = [
  { value: 'MM', label: 'mm', name: 'Millimetres' },
  { value: 'CM', label: 'cm', name: 'Centimetres' },
  { value: 'M', label: 'm', name: 'Metres' },
  { value: 'IN', label: 'in', name: 'Inches' },
  { value: 'FT', label: 'ft', name: 'Feet' },
];

/** Where the colour picker starts for a row that has no swatch yet. */
export const DEFAULT_SWATCH = '#b7410e';

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'name_desc', label: 'Name: Z–A' },
];

/** Stock at or below this (but above 0) is flagged as low in the list. */
export const LOW_STOCK_THRESHOLD = 5;

/** Backend default is 20; max is 100. */
export const PRODUCT_LIST_LIMIT = 20;

export const PRODUCT_DELETE_CONFIRMATION = 'DELETE';

export const DEACTIVATE_WARNING =
  'Deactivated products are hidden from the storefront and public API, but stay visible here and can be reactivated at any time.';

/** Query-string keys for the product list (server-side filters only). */
export const PRODUCT_LIST_SEARCH_PARAMS = {
  PAGE: 'page',
  CATEGORY_ID: 'categoryId',
  IS_FEATURED: 'isFeatured',
  IS_BESTSELLER: 'isBestseller',
  AVAILABILITY: 'availability',
  IS_ACTIVE: 'isActive',
  SORT: 'sort',
  SEARCH: 'search',
} as const;

/** Radix Select cannot use an empty string as a value. */
export const FILTER_ALL = 'all';
