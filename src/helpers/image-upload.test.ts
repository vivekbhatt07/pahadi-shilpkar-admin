import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  firstThatFits,
  fitWithin,
  ImageTooLargeError,
  MAX_UPLOAD_SIZE_BYTES,
  prepareImageForUpload,
} from './image-upload';

const fileOfSize = (bytes: number, type: string, name = 'photo') =>
  new File([new Uint8Array(bytes)], name, { type });

describe('fitWithin', () => {
  it('scales the longer side down to the limit, keeping the shape', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3000, 6000)).toEqual({ width: 1000, height: 2000 });
  });

  it('never scales a smaller photo up', () => {
    expect(fitWithin(1200, 800)).toEqual({ width: 1200, height: 800 });
  });
});

describe('firstThatFits', () => {
  it('keeps the best quality that comes in under the limit', async () => {
    const encode = vi.fn(
      async (quality: number) =>
        new Blob([new Uint8Array(quality > 0.7 ? 3_000_000 : 1_000_000)]),
    );

    const blob = await firstThatFits(encode);

    expect(blob?.size).toBe(1_000_000);
    expect(encode.mock.calls.map(([quality]) => quality)).toEqual([
      0.86, 0.78, 0.7,
    ]);
  });

  it('gives up when nothing fits', async () => {
    expect(
      await firstThatFits(async () => new Blob([new Uint8Array(10)]), 5),
    ).toBeNull();
  });
});

describe('prepareImageForUpload', () => {
  type TEncoder = (type: string, quality: number) => Blob | null;

  // jsdom draws nothing — a stand-in for the browser's decoder and canvas,
  // noting what was drawn at what size
  const drawn: { width: number; height: number; background?: string }[] = [];
  const browser = ({
    size = { width: 4000, height: 3000 },
    encode = (type) => new Blob([new Uint8Array(500_000)], { type }),
    readable = true,
  }: {
    size?: { width: number; height: number };
    encode?: TEncoder;
    readable?: boolean;
  } = {}) => {
    drawn.length = 0;
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        if (!readable) throw new Error('Unsupported image');
        return { ...size, close: vi.fn() };
      }),
    );
    let background: string | undefined;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      function (this: HTMLCanvasElement) {
        return {
          clearRect: () => {
            background = undefined;
          },
          fillRect: () => undefined,
          set fillStyle(value: string) {
            background = value;
          },
          drawImage: () =>
            drawn.push({
              width: this.width,
              height: this.height,
              background,
            }),
        } as unknown as CanvasRenderingContext2D;
      } as never,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback, type = 'image/png', quality = 0.92) =>
        callback(encode(type, quality)),
    );
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('re-encodes even a photo that fits — no larger than 2000px, without its metadata', async () => {
    browser();
    const photo = fileOfSize(1_000_000, 'image/jpeg', 'vase.jpeg');

    const sent = await prepareImageForUpload(photo);

    expect(sent).not.toBe(photo);
    expect(sent.name).toBe('vase.jpg');
    expect(sent.type).toBe('image/jpeg');
    expect(sent.size).toBe(500_000);
    expect(drawn).toEqual([{ width: 2000, height: 1500 }]);
  });

  it('steps the quality down until a big photo fits 2MB', async () => {
    const qualities: number[] = [];
    browser({
      encode: (type, quality) => {
        qualities.push(quality);
        return new Blob(
          [new Uint8Array(quality > 0.7 ? 3_000_000 : 1_500_000)],
          { type },
        );
      },
    });

    const sent = await prepareImageForUpload(
      fileOfSize(5_000_000, 'image/jpeg'),
    );

    expect(sent.size).toBe(1_500_000);
    expect(qualities).toEqual([0.86, 0.78, 0.7]);
  });

  it("keeps a PNG transparent as WebP — or puts it on white as JPEG where the browser can't write WebP", async () => {
    browser({ size: { width: 800, height: 800 } });
    const logo = await prepareImageForUpload(
      fileOfSize(300_000, 'image/png', 'logo.png'),
    );
    expect(logo.name).toBe('logo.webp');
    expect(drawn).toEqual([{ width: 800, height: 800 }]);

    // That browser hands back a PNG when asked for WebP
    browser({
      size: { width: 800, height: 800 },
      encode: (type) =>
        new Blob([new Uint8Array(200_000)], {
          type: type === 'image/webp' ? 'image/png' : type,
        }),
    });
    const flattened = await prepareImageForUpload(
      fileOfSize(300_000, 'image/png', 'logo.png'),
    );
    expect(flattened.name).toBe('logo.jpg');
    expect(drawn.at(-1)).toEqual({
      width: 800,
      height: 800,
      background: '#ffffff',
    });
  });

  it("sends a photo the browser can't read as it is — when it fits", async () => {
    browser({ readable: false });
    const photo = fileOfSize(MAX_UPLOAD_SIZE_BYTES, 'image/jpeg');

    expect(await prepareImageForUpload(photo)).toBe(photo);
    await expect(
      prepareImageForUpload(
        fileOfSize(MAX_UPLOAD_SIZE_BYTES + 1, 'image/jpeg'),
      ),
    ).rejects.toThrow(ImageTooLargeError);
  });

  it('sends a GIF as it is, and refuses a big one rather than lose its animation', async () => {
    browser();
    const gif = fileOfSize(1000, 'image/gif', 'spin.gif');
    expect(await prepareImageForUpload(gif)).toBe(gif);

    await expect(
      prepareImageForUpload(
        fileOfSize(MAX_UPLOAD_SIZE_BYTES + 1, 'image/gif', 'spin.gif'),
      ),
    ).rejects.toThrow(ImageTooLargeError);
    expect(drawn).toEqual([]);
  });
});
