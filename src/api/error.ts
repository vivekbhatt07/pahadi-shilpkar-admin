export type TApiFieldError = { field: string; message: string };

type TApiErrorOptions = {
  status?: number;
  fieldErrors?: TApiFieldError[];
  /**
   * `true` when the API client already performed the side-effect for this
   * error (sign-out on 401/403, rate-limit banner on 429). Consumers should
   * skip their generic error toast when this is set.
   */
  handled?: boolean;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly fieldErrors?: TApiFieldError[];
  readonly handled: boolean;

  constructor(message: string, options: TApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.fieldErrors = options.fieldErrors;
    this.handled = options.handled ?? false;
  }
}

const isFieldError = (item: unknown): item is TApiFieldError =>
  typeof item === 'object' &&
  item !== null &&
  typeof (item as TApiFieldError).field === 'string' &&
  typeof (item as TApiFieldError).message === 'string';

/**
 * A 400's field errors: the `errors` array, or — from a backend from before
 * it was added — the same list JSON-stringified in `error`:
 * `"[{\"field\":\"price\",\"message\":\"...\"}]"`.
 */
export const parseFieldErrors = (
  body: { error?: string; errors?: unknown } | undefined,
): TApiFieldError[] | undefined => {
  if (Array.isArray(body?.errors)) return body.errors.filter(isFieldError);
  if (!body?.error) return undefined;
  try {
    const parsed: unknown = JSON.parse(body.error);
    return Array.isArray(parsed) ? parsed.filter(isFieldError) : undefined;
  } catch {
    return undefined;
  }
};

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const getErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong',
) => (error instanceof Error && error.message ? error.message : fallback);
