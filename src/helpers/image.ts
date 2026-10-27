/**
 * Cloudinary photos shown resized, never as the original (up to 2000px, a
 * few hundred KB each). These are the storefront's own URLs — see its
 * src/lib/image.ts, and keep the two in step: Cloudinary stores every
 * distinct transformation as a copy, and making one costs a transformation
 * on the store's free plan, so asking for exactly what shoppers already
 * asked for means the copy is there.
 */

/** Slot shapes the storefront crops to. */
export type TImageAspect = '1:1' | '1:2' | '3:2' | '3:4' | '4:3';

/** The storefront's widths — ask for one of these, never another. */
export const IMAGE_WIDTHS = [320, 640, 960, 1280, 1600] as const;

export type TImageWidth = (typeof IMAGE_WIDTHS)[number];

/**
 * `https://res.cloudinary.com/<cloud>/image/upload/[<transforms>/]v<n>/<id>.<ext>`
 * — what the upload API returns. The transformation goes right before the
 * version. Signed (`s--…--`) and version-less URLs are left alone.
 */
const CLOUDINARY_UPLOAD =
  /^https?:\/\/(res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:(?!s--)[^/]+\/)*?)(v\d+\/[^?#]+\.(?:jpe?g|png|gif|webp|avif)(?:[?#].*)?)$/i;

/** Crop to the shape around the subject, then only ever scale down. */
const transformation = (width: number, aspect?: TImageAspect) =>
  [aspect && `c_fill,g_auto,ar_${aspect}`, `c_limit,w_${width},f_auto,q_auto`]
    .filter(Boolean)
    .join('/');

/**
 * `url` at `width` — cropped to `aspect` when given — or `url` itself when
 * it isn't a Cloudinary upload (a pasted link, say).
 */
export const resizedImage = (
  url: string,
  width: TImageWidth,
  aspect?: TImageAspect,
): string => {
  const match = CLOUDINARY_UPLOAD.exec(url);
  if (!match) return url;

  const [, base, asset] = match;
  return `https://${base}${transformation(width, aspect)}/${asset}`;
};

/**
 * An `<img>` onError for a resized copy: shows `original` instead — the copy
 * may be one Cloudinary couldn't make — and calls `onFail` if that fails too.
 */
export const showOriginalOnError =
  (original: string, onFail?: (image: HTMLImageElement) => void) =>
  ({ currentTarget: image }: React.SyntheticEvent<HTMLImageElement>) => {
    if (image.dataset.fallback) {
      onFail?.(image);
      return;
    }
    image.dataset.fallback = 'original';
    image.src = original;
  };
