export const VALIDATION_MESSAGES = {
  FIRST_NAME: {
    MAX: 'First name must be under 50 characters',
    INVALID: 'First name can only contain letters, hyphens, and apostrophes',
  },
  LAST_NAME: {
    MAX: 'Last name must be under 50 characters',
    INVALID: 'Last name can only contain letters, hyphens, and apostrophes',
  },
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please enter a valid email address',
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    INVALID:
      'Password must be 8-64 characters with uppercase, lowercase, number, and special character',
  },
  CONFIRM_PASSWORD: {
    REQUIRED: 'Confirm password is required',
    INVALID: 'Passwords do not match',
  },
  CURRENT_PASSWORD: {
    REQUIRED: 'Current password is required',
  },
  BIO: {
    MAX: 'Bio must be under 200 characters',
  },
  URL: {
    INVALID: 'Please enter a valid URL',
  },
  SLUG: {
    INVALID: 'Slug can only contain lowercase letters, numbers, and hyphens',
  },
  CATEGORY: {
    NAME_REQUIRED: 'Category name is required',
    NAME_MAX: 'Category name must be 50 characters or fewer',
    DESCRIPTION_MAX: 'Description must be 300 characters or fewer',
    SLUG_MAX: 'Slug must be 120 characters or fewer',
  },
  PRODUCT: {
    NAME_REQUIRED: 'Product name is required',
    NAME_MAX: 'Product name must be 100 characters or fewer',
    DESCRIPTION_MAX: 'Description must be 2000 characters or fewer',
    SHORT_DESCRIPTION_MAX: 'Short description must be 200 characters or fewer',
    PRICE_REQUIRED: 'Price is required',
    PRICE_POSITIVE: 'Price must be a positive number',
    COMPARE_AT_PRICE_POSITIVE: 'Compare-at price must be a positive number',
    COMPARE_AT_PRICE_GREATER:
      'Compare-at price must be greater than the selling price',
    STOCK_REQUIRED: 'Stock is required',
    STOCK_INTEGER: 'Stock must be a whole number',
    STOCK_MIN: 'Stock cannot be negative',
    CATEGORY_REQUIRED: 'Please select a category',
    SLUG_MAX: 'Slug must be 120 characters or fewer',
    SKU_MAX: 'SKU must be 50 characters or fewer',
    SKU_INVALID:
      'SKU can only contain letters, numbers, hyphens, and underscores',
    HIGHLIGHT_MAX: 'Each highlight must be 150 characters or fewer',
    HIGHLIGHTS_MAX: 'You can add up to 10 highlights',
    IMAGES_MAX: 'You can add up to 10 images',
    VIDEO_URL_INVALID: 'Please enter a valid video URL',
    MATERIAL_MAX: 'Material must be 100 characters or fewer',
    COLOR_NAME_REQUIRED: 'Each colour needs a name',
    COLOR_NAME_MAX: 'Colour names must be 30 characters or fewer',
    COLOR_NAME_DUPLICATE: 'This colour is already listed',
    COLOR_HEX_INVALID: 'Swatch must be a hex colour like #b7410e',
    COLORS_MAX: 'You can add up to 10 colours',
    MEASUREMENT_SIZE_INVALID:
      'Enter a number above 0 and up to 10,000, with at most 2 decimals',
    MEASUREMENT_NOTE_MAX: 'Note must be 100 characters or fewer',
    MEASUREMENT_AT_LEAST_ONE:
      'Enter at least one size — length, width or height',
    WEIGHT_MAX: 'Weight must be 50 characters or fewer',
    CARE_INSTRUCTIONS_MAX: 'Care instructions must be 1000 characters or fewer',
    SPEC_LABEL_REQUIRED: 'Label is required',
    SPEC_LABEL_MAX: 'Label must be 50 characters or fewer',
    SPEC_VALUE_REQUIRED: 'Value is required',
    SPEC_VALUE_MAX: 'Value must be 200 characters or fewer',
    SPECS_MAX: 'You can add up to 20 specifications',
    TAG_MAX: 'Each tag must be 30 characters or fewer',
    TAGS_MAX: 'You can add up to 20 tags',
    WHATSAPP_MESSAGE_MAX: 'Message must be 500 characters or fewer',
    PURCHASE_LINK_URL_REQUIRED: 'Link URL is required',
    PURCHASE_LINK_URL_INVALID: 'Please enter a valid http(s) URL',
    PURCHASE_LINK_LABEL_MAX: 'Label must be 50 characters or fewer',
    PURCHASE_LINKS_MAX: 'You can add up to 10 purchase links',
    META_TITLE_MAX: 'Meta title must be 70 characters or fewer',
    META_DESCRIPTION_MAX: 'Meta description must be 160 characters or fewer',
  },
  COMBO: {
    NAME_REQUIRED: 'Combo name is required',
    NAME_MAX: 'Combo name must be 100 characters or fewer',
    ITEMS_REQUIRED: 'Add at least one product',
    ITEMS_MAX: 'A combo can hold up to 10 products',
    MIN_UNITS:
      'A combo needs at least 2 items in total — add another product or raise a quantity',
    QUANTITY_REQUIRED: 'Quantity is required',
    QUANTITY_INTEGER: 'Quantity must be a whole number',
    QUANTITY_RANGE: 'Quantity must be between 1 and 99',
  },
  SETTINGS: {
    WHATSAPP_NUMBER_INVALID: 'Please enter a valid phone number',
    TEMPLATE_MAX: 'Message template must be 500 characters or fewer',
    CONTACT_PHONE_MAX: 'Phone number must be 20 characters or fewer',
  },
  BANNER: {
    TITLE_REQUIRED: 'Title is required',
    TITLE_MAX: 'Title must be 80 characters or fewer',
    SUBTITLE_MAX: 'Subtitle must be 200 characters or fewer',
    IMAGE_REQUIRED: 'Add an image',
    CTA_LABEL_MAX: 'Button label must be 30 characters or fewer',
    CTA_URL_MAX: 'Link must be 500 characters or fewer',
    CTA_URL_INVALID:
      'Use a storefront path like /products or a full http(s) link',
    CTA_URL_REQUIRED: 'A button label needs a link',
    SCHEDULE_INVALID: 'The end must be after the start',
  },
  INQUIRY: {
    NOTE_MAX: 'Note must be 1000 characters or fewer',
  },
};
