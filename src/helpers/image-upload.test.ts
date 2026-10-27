import { describe, expect, it, vi } from 'vitest';

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
  it('sends a photo that already fits as it is', async () => {
    const photo = fileOfSize(MAX_UPLOAD_SIZE_BYTES, 'image/jpeg');
    expect(await prepareImageForUpload(photo)).toBe(photo);
  });

  it('refuses a big GIF rather than lose its animation', async () => {
    await expect(
      prepareImageForUpload(
        fileOfSize(MAX_UPLOAD_SIZE_BYTES + 1, 'image/gif', 'spin.gif'),
      ),
    ).rejects.toThrow(ImageTooLargeError);
  });
});
