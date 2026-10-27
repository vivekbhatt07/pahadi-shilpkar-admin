/**
 * The backend takes photos of up to 2 MB, and a phone's are often 3–6 MB. So
 * a photo over the limit is shrunk here before it's sent: scaled to fit
 * MAX_EDGE_PX on its longer side — the storefront never shows one larger
 * than 1600px — and re-encoded, the quality stepping down until it fits.
 * A photo already under the limit is sent untouched.
 */

export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;

const MAX_EDGE_PX = 2000;
const QUALITIES = [0.86, 0.78, 0.7, 0.6, 0.5];

export class ImageTooLargeError extends Error {}

/** Width and height scaled to fit `maxEdge` on the longer side — never up. */
export const fitWithin = (
  width: number,
  height: number,
  maxEdge = MAX_EDGE_PX,
) => {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

/** The best quality that comes in under `maxBytes`, trying each in turn. */
export const firstThatFits = async (
  encode: (quality: number) => Promise<Blob | null>,
  maxBytes = MAX_UPLOAD_SIZE_BYTES,
  qualities: readonly number[] = QUALITIES,
): Promise<Blob | null> => {
  for (const quality of qualities) {
    const blob = await encode(quality);
    if (blob && blob.size <= maxBytes) return blob;
  }
  return null;
};

// The photo the right way up: createImageBitmap reads the camera's
// orientation; an <img> does by default, where there's no createImageBitmap
const decode = async (
  file: File,
): Promise<CanvasImageSource & { width: number; height: number }> => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const encodeCanvas = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * The file to upload: `file` itself when it fits, else a smaller copy —
 * WebP for a PNG or WebP, which may be transparent (JPEG on white where the
 * browser can't write WebP), JPEG for anything else. Re-encoding drops the
 * photo's metadata, the camera's location among it. A GIF over the limit is
 * refused rather than flattened: it would lose its animation.
 */
export const prepareImageForUpload = async (file: File): Promise<File> => {
  if (file.size <= MAX_UPLOAD_SIZE_BYTES) return file;
  if (file.type === 'image/gif') {
    throw new ImageTooLargeError(
      `${file.name} is over 2MB — GIFs can't be shrunk without losing their animation`,
    );
  }

  const source = await decode(file);
  const { width, height } = fitWithin(source.width, source.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new ImageTooLargeError(`${file.name} is over 2MB`);

  const draw = (background?: string) => {
    context.clearRect(0, 0, width, height);
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(source, 0, 0, width, height);
  };

  let type =
    file.type === 'image/png' || file.type === 'image/webp'
      ? 'image/webp'
      : 'image/jpeg';
  draw();
  let blob = await firstThatFits((quality) =>
    encodeCanvas(canvas, type, quality),
  );

  // A browser that can't write WebP hands back a PNG instead
  if (type === 'image/webp' && (!blob || blob.type !== 'image/webp')) {
    type = 'image/jpeg';
    draw('#ffffff');
    blob = await firstThatFits((quality) =>
      encodeCanvas(canvas, type, quality),
    );
  }
  if ('close' in source && typeof source.close === 'function') source.close();

  if (!blob) {
    throw new ImageTooLargeError(
      `${file.name} couldn't be made smaller than 2MB`,
    );
  }

  const name = `${file.name.replace(/\.[^.]+$/, '')}.${type === 'image/webp' ? 'webp' : 'jpg'}`;
  return new File([blob], name, { type, lastModified: Date.now() });
};
