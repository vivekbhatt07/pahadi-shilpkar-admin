import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { jobsService } from '@/api/services/jobs';
import type { FailedJob } from '@/types/api';

import FailedJobsDialog from './FailedJobsDialog';

const job = (id: string, type: string, lastError: string): FailedJob => ({
  id,
  type,
  attempts: 5,
  lastError,
  createdAt: '2026-10-27T09:00:00.000Z',
  failedAt: '2026-10-27T09:43:00.000Z',
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FailedJobsDialog', () => {
  it('says what each one left undone, and tries one again or dismisses it', async () => {
    vi.spyOn(jobsService, 'failed').mockResolvedValue({
      success: true,
      message: '',
      data: {
        items: [
          job('j1', 'STOCK_ALERTS', 'Failed to send emails'),
          job('j2', 'SOMETHING_NEW', 'Boom'),
        ],
        total: 2,
      },
    });
    const retry = vi
      .spyOn(jobsService, 'retry')
      .mockResolvedValue({ success: true, message: 'Trying it again now' });
    const dismiss = vi
      .spyOn(jobsService, 'dismiss')
      .mockResolvedValue({ success: true, message: 'Dismissed' });

    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <FailedJobsDialog open onOpenChange={() => undefined} />
      </QueryClientProvider>,
    );

    const alerts = (await screen.findByText('Back-in-stock emails')).closest(
      'li',
    )!;
    expect(
      within(alerts).getByText(/weren't told it's back/),
    ).toBeInTheDocument();
    expect(
      within(alerts).getByText('Failed to send emails'),
    ).toBeInTheDocument();
    // A type this panel doesn't know shows as itself
    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();

    await userEvent.click(
      within(alerts).getByRole('button', { name: 'Try again' }),
    );
    expect(retry).toHaveBeenCalledWith('j1');

    await userEvent.click(
      screen.getByRole('button', { name: 'Dismiss: SOMETHING_NEW' }),
    );
    expect(dismiss).toHaveBeenCalledWith('j2');
  });
});
