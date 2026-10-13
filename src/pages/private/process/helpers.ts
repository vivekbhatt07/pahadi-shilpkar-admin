import type {
  ProcessPage,
  ProcessStep,
  UpdateProcessPagePayload,
  UpdateProcessStepPayload,
} from '@/types/api';

import type { TProcessPageFormData, TProcessStepFormData } from './types';

export const toPageFormData = (
  page?: ProcessPage | null,
): TProcessPageFormData => ({
  title: page?.title ?? '',
  intro: page?.intro ?? '',
  heroImage: page?.heroImage ?? '',
  stats: page?.stats ?? [],
});

/** Form values as API fields: empty text clears a field (the storefront's copy shows). */
export const toPagePayload = (
  data: Partial<TProcessPageFormData>,
): UpdateProcessPagePayload => ({
  ...(data.title !== undefined && { title: data.title || null }),
  ...(data.intro !== undefined && { intro: data.intro || null }),
  ...(data.heroImage !== undefined && { heroImage: data.heroImage || null }),
  ...(data.stats !== undefined && { stats: data.stats }),
});

export const toStepFormData = (
  step?: ProcessStep | null,
): TProcessStepFormData => ({
  title: step?.title ?? '',
  description: step?.description ?? '',
  image: step?.image ?? '',
  videoUrl: step?.videoUrl ?? '',
  duration: step?.duration ?? '',
  isActive: step?.isActive ?? true,
});

/** Form values as API fields: empty text clears a field. */
export const toStepPayload = (
  data: Partial<TProcessStepFormData>,
): UpdateProcessStepPayload => ({
  ...(data.title !== undefined && { title: data.title }),
  ...(data.description !== undefined && { description: data.description }),
  ...(data.image !== undefined && { image: data.image || null }),
  ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl || null }),
  ...(data.duration !== undefined && { duration: data.duration || null }),
  ...(data.isActive !== undefined && { isActive: data.isActive }),
});
