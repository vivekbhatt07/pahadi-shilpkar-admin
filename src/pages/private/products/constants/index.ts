import type {
  ProductAvailability,
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
  DIMENSIONS: 'dimensions',
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
  DIMENSIONS_MAX: 100,
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
