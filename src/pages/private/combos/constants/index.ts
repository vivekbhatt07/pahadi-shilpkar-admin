export const COMBO_FORM_FIELD_NAMES = {
  NAME: 'name',
  SLUG: 'slug',
  SHORT_DESCRIPTION: 'shortDescription',
  DESCRIPTION: 'description',
  PRICE: 'price',
  IMAGES: 'images',
  ITEMS: 'items',
  IS_FEATURED: 'isFeatured',
  IS_ACTIVE: 'isActive',
  WHATSAPP_MESSAGE: 'whatsappMessage',
  PURCHASE_LINKS: 'purchaseLinks',
  META_TITLE: 'metaTitle',
  META_DESCRIPTION: 'metaDescription',
} as const;

/** Mirrors the backend; the storefront fields share the product limits. */
export const COMBO_LIMITS = {
  ITEMS_MAX: 10,
  MIN_UNITS: 2,
  QUANTITY_MAX: 99,
} as const;

/** Backend default is 20; max is 100. */
export const COMBO_LIST_LIMIT = 20;

/** The backend lists at most this many combos on a product's detail. */
export const PRODUCT_DETAIL_COMBOS_LIMIT = 4;

/** Results shown in the product picker while adding items. */
export const PRODUCT_PICKER_LIMIT = 8;

export const COMBO_DEACTIVATE_WARNING =
  'Inactive combos are hidden from the storefront, but stay visible here and can be reactivated at any time.';

export const COMBO_HIDDEN_BY_PRODUCT_WARNING =
  'A combo is only shown on the storefront while every product in it is active.';

/** Query-string keys for the combo list (server-side filters only). */
export const COMBO_LIST_SEARCH_PARAMS = {
  PAGE: 'page',
  PRODUCT_ID: 'productId',
  IS_FEATURED: 'isFeatured',
  IS_ACTIVE: 'isActive',
  SORT: 'sort',
  SEARCH: 'search',
} as const;
