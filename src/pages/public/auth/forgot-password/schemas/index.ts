import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@/constants/messages/shared';
import { FORGOT_PASSWORD_FORM_FIELD_NAMES } from '../constants';

export const forgotPasswordFormDataSchema = z.object({
  [FORGOT_PASSWORD_FORM_FIELD_NAMES.EMAIL]: z
    .string()
    .min(1, VALIDATION_MESSAGES.EMAIL.REQUIRED)
    .pipe(z.email(VALIDATION_MESSAGES.EMAIL.INVALID)),
});
