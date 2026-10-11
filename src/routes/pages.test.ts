import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { preloadPagesWhenIdle } from '@/routes/pages';

const Page = () => null;

describe('preloadPagesWhenIdle', () => {
  let runIdleTask: () => void;
  const cancelIdle = vi.fn();

  beforeEach(() => {
    runIdleTask = () => undefined;
    vi.stubGlobal('requestIdleCallback', (task: () => void) => {
      runIdleTask = task;
      return 7;
    });
    vi.stubGlobal('cancelIdleCallback', cancelIdle);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    cancelIdle.mockClear();
  });

  it('fetches every page once the browser is idle, not before', () => {
    const load = vi.fn(async () => ({ default: Page }));
    preloadPagesWhenIdle([load, load]);
    expect(load).not.toHaveBeenCalled();

    runIdleTask();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('can be cancelled before the browser gets to it', () => {
    preloadPagesWhenIdle([vi.fn()])();
    expect(cancelIdle).toHaveBeenCalledWith(7);
  });

  it('skips fetching while offline — a failed import sticks until reload', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const load = vi.fn(async () => ({ default: Page }));

    preloadPagesWhenIdle([load]);
    runIdleTask();
    expect(load).not.toHaveBeenCalled();
  });

  it('swallows a failed fetch — the page retries when visited', async () => {
    const load = vi.fn(() => Promise.reject(new Error('flaky network')));
    preloadPagesWhenIdle([load]);
    runIdleTask();
    // Nothing here handles the rejection: if preloading didn't, Vitest would
    // report it as unhandled and fail the run
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(load).toHaveBeenCalledOnce();
  });
});
