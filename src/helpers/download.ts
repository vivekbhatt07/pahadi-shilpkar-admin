import type { AxiosResponse } from 'axios';

/** "attachment; filename=\"sales-2026-10-20.csv\"" → "sales-2026-10-20.csv" */
const filenameFrom = (disposition: unknown): string | null => {
  if (typeof disposition !== 'string') return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Hands a file the API sent — a CSV export — to the browser to save, under
 * the name the server gave it (when CORS lets that header through), else
 * `fallbackName`.
 */
export const saveDownload = (
  response: AxiosResponse<Blob>,
  fallbackName: string,
) => {
  const name =
    filenameFrom(response.headers['content-disposition']) ?? fallbackName;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // After the click has been handled — revoking at once can cancel it
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
