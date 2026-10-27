import { ROUTES } from '@/constants/routes';
import type { ActivityArea, AdminActivity } from '@/types/api';

const VERBS: Record<AdminActivity['method'], string> = {
  POST: 'Added',
  PUT: 'Saved',
  PATCH: 'Edited',
  DELETE: 'Deleted',
};

// Routes the verb-and-noun rule would word badly, as written in the API
const PHRASES: Record<string, string> = {
  'PATCH /api/products/bulk': 'Bulk-edited products',
  'POST /api/products/:id/duplicate': 'Duplicated product',
  'PATCH /api/products/:id/variants/:variantId': 'Edited a variant of',
  'PATCH /api/categories/reorder': 'Reordered the categories',
  'PATCH /api/banners/reorder': 'Reordered the banners',
  'PATCH /api/testimonials/moderate': 'Moderated reviews',
  'PATCH /api/testimonials/:id/feature': 'Pinned or unpinned a review',
  'PATCH /api/testimonials/:id/photo-request': 'Answered a photo request',
  'PATCH /api/process/page': 'Edited the “How we make it” page',
  'PATCH /api/process/steps/reorder': 'Reordered the making steps',
  'PATCH /api/settings': 'Edited the store settings',
  'PATCH /api/costing/settings': 'Edited the costing settings',
  'POST /api/costing/materials/:id/purchases': 'Recorded a purchase of',
  'DELETE /api/costing/materials/:id/purchases/:purchaseId':
    'Deleted a purchase of',
  'PUT /api/costing/sheets': 'Saved a cost sheet',
  'DELETE /api/costing/sheets/:id': 'Deleted a cost sheet',
  'POST /api/storage/unused-images/delete': 'Deleted unused photos',
};

// What a route's rows are called — the first prefix that matches
const NOUNS: [prefix: string, noun: string][] = [
  ['/api/costing/materials', 'raw material'],
  ['/api/costing/sales', 'sale'],
  ['/api/process/steps', 'making step'],
  ['/api/products', 'product'],
  ['/api/combos', 'combo'],
  ['/api/categories', 'category'],
  ['/api/banners', 'banner'],
  ['/api/inquiries', 'inquiry'],
  ['/api/testimonials', 'review'],
];

/** "Edited product", "Reordered the banners" — what an entry did, in words. */
export const describeActivity = ({
  method,
  route,
}: Pick<AdminActivity, 'method' | 'route'>) => {
  const phrase = PHRASES[`${method} ${route}`];
  if (phrase) return phrase;
  const noun = NOUNS.find(([prefix]) => route.startsWith(prefix))?.[1];
  return noun ? `${VERBS[method] ?? method} ${noun}` : `${method} ${route}`;
};

/**
 * Where the thing changed can be seen in the panel — none once it's
 * deleted, or for areas without a page of their own.
 */
export const activityLink = ({
  route,
  target,
  targetId,
}: Pick<AdminActivity, 'route' | 'target' | 'targetId'>) => {
  if (!targetId || !target) return null;
  if (route.startsWith('/api/products') && target.slug) {
    return ROUTES.PRIVATE.PRODUCTS.DETAIL(target.slug);
  }
  if (route.startsWith('/api/combos') && target.slug) {
    return ROUTES.PRIVATE.COMBOS.DETAIL(target.slug);
  }
  if (route.startsWith('/api/costing/materials')) {
    return ROUTES.PRIVATE.COSTING.MATERIAL(targetId);
  }
  if (route.startsWith('/api/categories')) return ROUTES.PRIVATE.CATEGORIES;
  if (route.startsWith('/api/banners')) return ROUTES.PRIVATE.BANNERS;
  if (route.startsWith('/api/inquiries')) return ROUTES.PRIVATE.INQUIRIES;
  if (route.startsWith('/api/process')) return ROUTES.PRIVATE.PROCESS;
  return null;
};

/** "compareAtPrice" → "compare at price" — how the fields sent read. */
export const fieldLabel = (field: string) =>
  field.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

export const ACTIVITY_AREA_OPTIONS: { value: ActivityArea; label: string }[] = [
  { value: 'products', label: 'Products' },
  { value: 'combos', label: 'Combos' },
  { value: 'categories', label: 'Categories' },
  { value: 'banners', label: 'Banners' },
  { value: 'process', label: 'How we make it' },
  { value: 'inquiries', label: 'Inquiries' },
  { value: 'testimonials', label: 'Reviews' },
  { value: 'settings', label: 'Store settings' },
  { value: 'costing', label: 'Costing & sales' },
  { value: 'storage', label: 'Photo storage' },
];
