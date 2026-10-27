import { describe, expect, it } from 'vitest';

import { resizedImage } from './image';

const UPLOAD = 'https://res.cloudinary.com/demo/image/upload';
const ASSET = 'v1712345678/pahadishilpkar/products/panel.jpg';

describe('resizedImage', () => {
  // These must stay exactly the storefront's URLs (its src/lib/image.ts), so
  // the panel uses the copies Cloudinary already made for shoppers
  it("asks for the storefront's square thumbnail", () => {
    expect(resizedImage(`${UPLOAD}/${ASSET}`, 320, '1:1')).toBe(
      `${UPLOAD}/c_fill,g_auto,ar_1:1/c_limit,w_320,f_auto,q_auto/${ASSET}`,
    );
  });

  it('scales without cropping when no shape is given', () => {
    expect(resizedImage(`${UPLOAD}/${ASSET}`, 1280)).toBe(
      `${UPLOAD}/c_limit,w_1280,f_auto,q_auto/${ASSET}`,
    );
  });

  it('keeps transformations the URL already carries', () => {
    expect(resizedImage(`${UPLOAD}/e_sharpen/${ASSET}`, 640)).toBe(
      `${UPLOAD}/e_sharpen/c_limit,w_640,f_auto,q_auto/${ASSET}`,
    );
  });

  it.each([
    ['a link from elsewhere', 'https://example.com/panel.jpg'],
    ['a signed URL', `${UPLOAD}/s--Ab12Cd34--/${ASSET}`],
    ['a version-less URL', `${UPLOAD}/pahadishilpkar/products/panel.jpg`],
  ])('leaves %s alone', (_label, url) => {
    expect(resizedImage(url, 320, '1:1')).toBe(url);
  });
});
