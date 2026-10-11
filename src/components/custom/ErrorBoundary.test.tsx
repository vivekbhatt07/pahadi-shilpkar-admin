import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ErrorBoundary from '@/components/custom/ErrorBoundary';
import ErrorFallback from '@/components/custom/ErrorFallback';

let failure: Error | null = null;

const Page = () => {
  if (failure) throw failure;
  return <p>Products</p>;
};

const boundary = (resetKey: string) => (
  <ErrorBoundary
    resetKey={resetKey}
    fallback={(props) => <ErrorFallback {...props} />}
  >
    <Page />
  </ErrorBoundary>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React reports every caught error to the console
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    failure = null;
    vi.restoreAllMocks();
  });

  it('keeps a crash inside the page and lets the admin retry', async () => {
    failure = new Error('Cannot read properties of undefined');
    render(boundary('/products'));
    expect(
      screen.getByText('This page ran into a problem'),
    ).toBeInTheDocument();

    failure = null;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('recovers on navigation, including between settings tabs', () => {
    failure = new Error('boom');
    const { rerender } = render(boundary('/settings/profile'));
    expect(
      screen.getByText('This page ran into a problem'),
    ).toBeInTheDocument();

    failure = null;
    rerender(boundary('/settings/store'));
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('offers only a reload when the page code is gone after a deploy', () => {
    failure = new TypeError('Importing a module script failed.');
    render(boundary('/products'));
    expect(
      screen.getByText('A new version of the admin is available'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /try again/i }),
    ).not.toBeInTheDocument();
  });
});
