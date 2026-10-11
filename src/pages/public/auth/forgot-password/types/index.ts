import type { z } from 'zod';
import type { forgotPasswordFormDataSchema } from '../schemas';

export type TForgotPasswordFormData = z.infer<
  typeof forgotPasswordFormDataSchema
>;
