import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@/constants/messages/shared';
import { SIGN_IN_FORM_FIELD_NAMES } from '../constants';

export const signInFormDataSchema = z.object({
  [SIGN_IN_FORM_FIELD_NAMES.EMAIL]: z
    .string()
    .min(1, VALIDATION_MESSAGES.EMAIL.REQUIRED)
    .pipe(z.email(VALIDATION_MESSAGES.EMAIL.INVALID)),
  // Only presence is checked here; the backend decides if it matches.
  [SIGN_IN_FORM_FIELD_NAMES.PASSWORD]: z
    .string()
    .min(1, VALIDATION_MESSAGES.PASSWORD.REQUIRED),
});
