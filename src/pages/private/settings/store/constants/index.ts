export const STORE_SETTINGS_FORM_FIELD_NAMES = {
  WHATSAPP_NUMBER: 'whatsappNumber',
  WHATSAPP_MESSAGE_TEMPLATE: 'whatsappMessageTemplate',
  /** The store default; null = prices say nothing about delivery. */
  DELIVERY_CHARGE: 'deliveryCharge',
  DELIVERY_FEE: 'deliveryFee',
  CONTACT_EMAIL: 'contactEmail',
  CONTACT_PHONE: 'contactPhone',
  INSTAGRAM_URL: 'instagramUrl',
  FACEBOOK_URL: 'facebookUrl',
  YOUTUBE_URL: 'youtubeUrl',
} as const;

export const STORE_SETTINGS_LIMITS = {
  WHATSAPP_MESSAGE_TEMPLATE_MAX: 500,
  CONTACT_PHONE_MAX: 20,
} as const;

/** What the backend uses when whatsappMessageTemplate is null. */
export const DEFAULT_WHATSAPP_TEMPLATE =
  "Hi! I'm interested in buying *{{productName}}* ({{price}}) from Pahadi Shilpkar. {{productUrl}}";
