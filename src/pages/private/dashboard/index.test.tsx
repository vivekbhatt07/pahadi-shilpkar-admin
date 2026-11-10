import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/api';
import { ApiError } from '@/api/error';
import type { DashboardStats } from '@/types/api';

import DashboardPage from '.';

const STATS: DashboardStats = {
  products: {
    total: 47,
    active: 40,
    featured: 3,
    bestseller: 2,
    byAvailability: {
      IN_STOCK: 30,
      OUT_OF_STOCK: 5,
      MADE_TO_ORDER: 10,
      COMING_SOON: 2,
    },
  },
  categories: { total: 6, active: 6 },
  combos: { total: 2, active: 2, visible: 2, featured: 1 },
  users: { total: 9, verified: 8, admins: 1 },
  testimonials: {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    avgRating: 0,
    photoRequests: 0,
  },
  inquiries: { total: 0, new: 0 },
  whatsappConfigured: true,
};

/** The API with only the stats route — as one a deploy behind answers. */
const mockApi = (stats: DashboardStats) =>
  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url === '/stats') {
      return { data: { success: true, message: '', data: stats } };
    }
    throw new ApiError('Route not found', { status: 404 });
  });

const renderDashboard = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => {
  // The stat cards count up unless the visitor prefers less motion
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DashboardPage', () => {
  it("still shows the counts when the API doesn't send failed jobs yet", async () => {
    mockApi(STATS);
    renderDashboard();

    expect(await screen.findByText('47')).toBeInTheDocument();
    expect(screen.queryByText(/background task/)).not.toBeInTheDocument();
  });

  it('says so when background jobs gave up', async () => {
    mockApi({ ...STATS, jobs: { failed: 2 } });
    renderDashboard();

    expect(
      await screen.findByText('2 background tasks gave up'),
    ).toBeInTheDocument();
  });
});
