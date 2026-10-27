import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/error';
import { storageService } from '@/api/services/storage';
import type { StorageUsage, UnusedImage } from '@/types/api';

import PhotoStoragePage from '.';

const USAGE: StorageUsage = {
  plan: 'Free',
  countedOn: '2026-10-26',
  credits: { used: 21, limit: 25, usedPercent: 84 },
  transformations: { used: 4200, credits: 4.2, limit: null, usedPercent: null },
  storage: {
    used: 2_500_000_000,
    credits: 2.33,
    limit: null,
    usedPercent: null,
  },
  bandwidth: {
    used: 14_500_000_000,
    credits: 14.47,
    limit: null,
    usedPercent: null,
  },
  usedPercent: 84,
};

const photo = (n: number): UnusedImage => ({
  publicId: `pahadishilpkar/products/photo-${n}`,
  url: `https://res.cloudinary.com/demo/image/upload/v1/pahadishilpkar/products/photo-${n}.jpg`,
  bytes: 1_000_000,
  uploadedAt: '2026-10-01T10:00:00.000Z',
});

const renderPage = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PhotoStoragePage />
    </QueryClientProvider>,
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PhotoStoragePage', () => {
  it("shows this month's credits and what used them", async () => {
    vi.spyOn(storageService, 'usage').mockResolvedValue({
      success: true,
      message: '',
      data: USAGE,
    });
    vi.spyOn(storageService, 'unusedImages').mockResolvedValue({
      success: true,
      message: '',
      data: { items: [], totalBytes: 0, minAgeDays: 2 },
    });
    renderPage();

    expect(await screen.findByText('of 25 credits')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Credits used' }),
    ).toHaveAttribute('aria-valuenow', '84');
    expect(screen.getByText('4,200 · 4.2 credits')).toBeInTheDocument();
    expect(screen.getByText('2.5 GB · 2.33 credits')).toBeInTheDocument();
    expect(await screen.findByText('No unused photos')).toBeInTheDocument();
  });

  it('deletes the unused photos picked — 100 a call', async () => {
    vi.spyOn(storageService, 'usage').mockResolvedValue({
      success: true,
      message: '',
      data: USAGE,
    });
    const photos = Array.from({ length: 150 }, (_, index) => photo(index));
    vi.spyOn(storageService, 'unusedImages').mockResolvedValue({
      success: true,
      message: '',
      data: { items: photos, totalBytes: 150_000_000, minAgeDays: 2 },
    });
    const remove = vi
      .spyOn(storageService, 'deleteUnusedImages')
      .mockImplementation(async (publicIds) => ({
        success: true,
        message: '',
        data: { deleted: publicIds.length },
      }));
    renderPage();

    await userEvent.click(
      await screen.findByRole('checkbox', { name: /Select all 150/ }),
    );
    expect(
      screen.getByText('150 of 150 selected · 150 MB'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Delete 150 unused photos?'),
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    await vi.waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
    expect(remove.mock.calls[0][0]).toHaveLength(100);
    expect(remove.mock.calls[1][0]).toEqual(
      photos.slice(100).map((item) => item.publicId),
    );
  });

  it('says so when the server has no Cloudinary', async () => {
    const notSetUp = new ApiError(
      'Image upload is not configured on the server',
      { status: 503 },
    );
    vi.spyOn(storageService, 'usage').mockRejectedValue(notSetUp);
    vi.spyOn(storageService, 'unusedImages').mockRejectedValue(notSetUp);
    renderPage();

    expect(
      await screen.findAllByText(
        'Image upload is not configured on the server',
      ),
    ).toHaveLength(2);
  });
});
