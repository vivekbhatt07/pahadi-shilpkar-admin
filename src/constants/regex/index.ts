export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,64}$/;

export const FIRST_NAME_REGEX = /^[A-Za-z]+([-'][A-Za-z]+)*$/;
export const LAST_NAME_REGEX = /^[A-Za-z]+([-'][A-Za-z]+)*$/;

export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SKU_REGEX = /^[A-Za-z0-9]([A-Za-z0-9_-]*[A-Za-z0-9])?$/;
export const WHATSAPP_NUMBER_REGEX = /^\+?[0-9][0-9\s-]{6,18}[0-9]$/;

/** #rgb or #rrggbb, any case. */
export const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}){1,2}$/i;
/** A product size: 12.5, not 12.555. */
export const MEASUREMENT_REGEX = /^\d+(?:\.\d{1,2})?$/;
