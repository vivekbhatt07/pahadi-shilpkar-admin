import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@/constants/messages/shared';

import { optionalUrl } from '../../store/schemas';
import {
  BRANDING_FORM_FIELD_NAMES as FIELDS,
  BRANDING_LIMITS as LIMITS,
} from '../constants';

const { BRANDING } = VALIDATION_MESSAGES;

const wording = (max: number, message: string) =>
  z.string().trim().max(max, message);

export const brandingFormSchema = z.object({
  [FIELDS.HEADER_LOGO_LIGHT]: optionalUrl,
  [FIELDS.HEADER_LOGO_DARK]: optionalUrl,
  [FIELDS.FAVICON]: optionalUrl,
  [FIELDS.FOOTER_LOGO_LIGHT]: optionalUrl,
  [FIELDS.FOOTER_LOGO_DARK]: optionalUrl,
  [FIELDS.FOOTER_TAGLINE]: wording(
    LIMITS.FOOTER_TAGLINE_MAX,
    BRANDING.FOOTER_TAGLINE_MAX,
  ),
  [FIELDS.FOOTER_ABOUT]: wording(
    LIMITS.FOOTER_ABOUT_MAX,
    BRANDING.FOOTER_ABOUT_MAX,
  ),
  [FIELDS.FOOTER_COPYRIGHT]: wording(
    LIMITS.FOOTER_COPYRIGHT_MAX,
    BRANDING.FOOTER_COPYRIGHT_MAX,
  ),
  [FIELDS.FOOTER_NOTE]: wording(
    LIMITS.FOOTER_NOTE_MAX,
    BRANDING.FOOTER_NOTE_MAX,
  ),
  [FIELDS.HERO_IMAGE]: optionalUrl,
  [FIELDS.AUTH_LOGO]: optionalUrl,
  [FIELDS.AUTH_IMAGE]: optionalUrl,
  [FIELDS.AUTH_HEADLINE]: wording(
    LIMITS.AUTH_HEADLINE_MAX,
    BRANDING.AUTH_HEADLINE_MAX,
  ),
  [FIELDS.AUTH_DESCRIPTION]: wording(
    LIMITS.AUTH_DESCRIPTION_MAX,
    BRANDING.AUTH_DESCRIPTION_MAX,
  ),
});
