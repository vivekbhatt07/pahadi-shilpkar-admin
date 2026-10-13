export const PROCESS_PAGE_FORM_FIELD_NAMES = {
  TITLE: 'title',
  INTRO: 'intro',
  HERO_IMAGE: 'heroImage',
  STATS: 'stats',
} as const;

export const PROCESS_STEP_FORM_FIELD_NAMES = {
  TITLE: 'title',
  DESCRIPTION: 'description',
  IMAGE: 'image',
  VIDEO_URL: 'videoUrl',
  DURATION: 'duration',
  IS_ACTIVE: 'isActive',
} as const;

/** Mirrors the backend's VALIDATION.PROCESS_* limits. */
export const PROCESS_LIMITS = {
  TITLE_MAX: 80,
  INTRO_MAX: 600,
  STATS_MAX: 4,
  STAT_VALUE_MAX: 12,
  STAT_LABEL_MAX: 40,
  STEP_TITLE_MAX: 80,
  STEP_DESCRIPTION_MAX: 1200,
  STEP_DURATION_MAX: 40,
  STEP_VIDEO_URL_MAX: 500,
  /** Reorder takes at most this many ids at once. */
  REORDER_MAX: 50,
} as const;

/**
 * What the storefront shows while a field is empty — placeholders here, so
 * the admin sees what they're replacing.
 */
export const PROCESS_DEFAULT_COPY = {
  TITLE: 'From the hills, by hand',
  INTRO:
    'Every piece passes through many hands before it reaches yours — from choosing the wood and wool in our villages to the last coat of natural finish. This is how it is made.',
} as const;
