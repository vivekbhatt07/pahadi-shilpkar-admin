import { describe, expect, it } from 'vitest';

import indexHtml from '../../index.html?raw';
import vercelJson from '../../vercel.json?raw';

const headers = (): Record<string, string> => {
  const config = JSON.parse(vercelJson) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  return Object.fromEntries(
    config.headers[0].headers.map(({ key, value }) => [key, value]),
  );
};

const sha256Base64 = async (text: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
};

describe('security headers (vercel.json)', () => {
  it("lets index.html's inline theme script run — edit one, update the other", async () => {
    const script = indexHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeDefined();

    expect(headers()['Content-Security-Policy']).toContain(
      `'sha256-${await sha256Base64(script!)}'`,
    );
  });

  it('keeps the panel out of frames and search results', () => {
    const sent = headers();
    expect(sent['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(sent['X-Frame-Options']).toBe('DENY');
    expect(sent['X-Robots-Tag']).toBe('noindex, nofollow');
  });
});
