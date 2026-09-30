import type {
  ProductAvailability,
  ProductMeasurements,
  ProductMeasurementsPayload,
} from '@/types/api';

import {
  AVAILABILITY_OPTIONS,
  DEFAULT_MEASUREMENT_UNIT,
  SHAPE_OPTIONS,
  SHAPE_SIZES,
  SIZE_LABELS,
  UNIT_OPTIONS,
} from './constants';
import type { TMeasurementsFormValue } from './types';

export const AVAILABILITY_LABELS = Object.fromEntries(
  AVAILABILITY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ProductAvailability, string>;

/** Badge variant per availability, shared by the list and detail pages. */
export const availabilityVariant = (availability: ProductAvailability) =>
  ({
    IN_STOCK: 'success',
    OUT_OF_STOCK: 'destructive',
    MADE_TO_ORDER: 'accent',
    COMING_SOON: 'warning',
  })[availability] as 'success' | 'destructive' | 'accent' | 'warning';

export const SHAPE_LABELS = Object.fromEntries(
  SHAPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ProductMeasurements['shape'], string>;

export const UNIT_LABELS = Object.fromEntries(
  UNIT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ProductMeasurements['unit'], string>;

export const EMPTY_MEASUREMENTS: TMeasurementsFormValue = {
  shape: null,
  unit: DEFAULT_MEASUREMENT_UNIT,
  length: null,
  width: null,
  height: null,
  diameter: null,
  note: '',
};

export const toMeasurementsFormValue = (
  measurements: ProductMeasurements | null,
): TMeasurementsFormValue =>
  measurements
    ? { ...measurements, note: measurements.note ?? '' }
    : EMPTY_MEASUREMENTS;

/**
 * The request body for the measurements inputs: null when no shape is
 * picked, otherwise only the sizes the shape uses — leftovers from switching
 * shapes are never sent.
 */
export const toMeasurementsPayload = (
  value: TMeasurementsFormValue,
): ProductMeasurementsPayload | null => {
  const { shape } = value;
  if (shape === null) return null;

  const payload: ProductMeasurementsPayload = { shape, unit: value.unit };
  SHAPE_SIZES[shape].sizes.forEach((size) => {
    if (value[size] !== null) payload[size] = value[size];
  });
  payload.note = value.note.trim() || null;
  return payload;
};

const formatSize = (size: number) =>
  size.toLocaleString('en-IN', { maximumFractionDigits: 2 });

/**
 * The shopper-facing text the API returns as `dimensions` — built the same
 * way so the form can preview it: "Round · Diameter 30 cm × Height 2 cm",
 * with the note on a line of its own.
 */
export const describeMeasurements = (
  measurements: ProductMeasurementsPayload,
): string => {
  const unit = UNIT_LABELS[measurements.unit ?? DEFAULT_MEASUREMENT_UNIT];
  const sizes = SHAPE_SIZES[measurements.shape].sizes
    .flatMap((size) => {
      const value = measurements[size];
      return value == null
        ? []
        : [`${SIZE_LABELS[size]} ${formatSize(value)} ${unit}`];
    })
    .join(' × ');
  // Curved shapes are named up front; "Length × Width" alone reads as a
  // rectangle, which is right for rectangular and fair for irregular pieces.
  const line =
    measurements.shape === 'ROUND' || measurements.shape === 'OVAL'
      ? `${SHAPE_LABELS[measurements.shape]} · ${sizes}`
      : sizes;

  return measurements.note ? `${line}\n${measurements.note}` : line;
};
