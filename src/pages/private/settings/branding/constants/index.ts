export const BRANDING_FORM_FIELD_NAMES = {
  HEADER_LOGO_LIGHT: 'headerLogoLight',
  HEADER_LOGO_DARK: 'headerLogoDark',
  FAVICON: 'favicon',
  FOOTER_LOGO_LIGHT: 'footerLogoLight',
  FOOTER_LOGO_DARK: 'footerLogoDark',
  FOOTER_TAGLINE: 'footerTagline',
  FOOTER_ABOUT: 'footerAbout',
  /** {{year}} becomes the current year. */
  FOOTER_COPYRIGHT: 'footerCopyright',
  FOOTER_NOTE: 'footerNote',
  HERO_IMAGE: 'heroImage',
  AUTH_LOGO: 'authLogo',
  AUTH_IMAGE: 'authImage',
  AUTH_HEADLINE: 'authHeadline',
  AUTH_DESCRIPTION: 'authDescription',
} as const;

export const BRANDING_FIELDS = Object.values(BRANDING_FORM_FIELD_NAMES);

export const BRANDING_LIMITS = {
  FOOTER_TAGLINE_MAX: 80,
  FOOTER_ABOUT_MAX: 400,
  FOOTER_COPYRIGHT_MAX: 120,
  FOOTER_NOTE_MAX: 200,
  AUTH_HEADLINE_MAX: 120,
  AUTH_DESCRIPTION_MAX: 400,
} as const;

/**
 * What the storefront says while each is blank, shown here as placeholders.
 * Keep in step with its src/lib/branding.ts.
 */
export const BRANDING_DEFAULT_TEXT = {
  FOOTER_TAGLINE: 'Handmade from the hills',
  FOOTER_ABOUT:
    'Every piece is shaped by hand in the villages of Uttarakhand — carved, woven and painted by artisans who learnt their craft from the generation before them.',
  FOOTER_COPYRIGHT: '© {{year}} Pahadi Shilpkar',
  FOOTER_NOTE: 'Orders are placed on WhatsApp or our partner marketplaces.',
  AUTH_HEADLINE: 'Crafted by hand, carried down from the hills.',
  AUTH_DESCRIPTION:
    'Sign in to review the pieces you love and keep your details in one place. Orders are placed with us directly on WhatsApp.',
} as const;
