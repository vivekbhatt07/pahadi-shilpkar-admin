// Browsers word a failed import() differently; Vite adds its own message when
// a chunk's CSS can't be preloaded.
const CHUNK_LOAD_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

/**
 * True when a page's code couldn't be downloaded — usually because a deploy
 * replaced the chunk this tab was built against. Only a reload fixes it: the
 * browser caches the failed import for the life of the page.
 */
export const isChunkLoadError = (error: unknown): boolean =>
  error instanceof Error && CHUNK_LOAD_ERROR.test(error.message);
