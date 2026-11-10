import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { settingsService } from '@/api/services/settings';
import { uploadService } from '@/api/services/upload';
import type { StoreSettings } from '@/types/api';

import BrandingSettingsPage from '.';

const LIGHT_LOGO = 'https://example.com/light.png';
const DARK_LOGO = 'https://example.com/dark.png';
const UPLOADED = 'https://res.cloudinary.com/demo/image/upload/v1/logo.svg';

const SETTINGS = {
  whatsappNumber: '919876543210',
  headerLogoLight: LIGHT_LOGO,
  headerLogoDark: DARK_LOGO,
  footerNote: 'Orders ship across India.',
} as StoreSettings;

const mockSettings = (settings = SETTINGS) => {
  vi.spyOn(settingsService, 'get').mockResolvedValue({
    success: true,
    message: '',
    data: settings,
  });
  return vi.spyOn(settingsService, 'update').mockResolvedValue({
    success: true,
    message: 'Store settings updated successfully',
    data: settings,
  });
};

const renderPage = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <BrandingSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const save = () =>
  userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

const fileInputs = () =>
  document.querySelectorAll<HTMLInputElement>('input[type="file"]');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BrandingSettingsPage', () => {
  it('previews each saved logo on the background it will sit on', async () => {
    mockSettings();
    renderPage();

    const light = await screen.findByAltText(
      'Header logo · light mode preview',
    );
    const dark = screen.getByAltText('Header logo · dark mode preview');

    expect(light).toHaveAttribute('src', LIGHT_LOGO);
    expect(light.parentElement).toHaveClass('bg-[#fcfaf6]');
    expect(dark).toHaveAttribute('src', DARK_LOGO);
    expect(dark.parentElement).toHaveClass('bg-stone-950');
  });

  it('uploads a logo untouched, and saves only what changed', async () => {
    const update = mockSettings();
    const upload = vi.spyOn(uploadService, 'brandImage').mockResolvedValue({
      success: true,
      message: '',
      data: { url: UPLOADED, publicId: 'pahadishilpkar/brand/logo' },
    });
    renderPage();
    await screen.findByAltText('Header logo · light mode preview');
    const logo = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' });

    // In page order: header light, header dark, favicon, footer light
    await userEvent.upload(fileInputs()[3], logo);

    await waitFor(() =>
      expect(
        screen.getByAltText('Footer logo · light mode preview'),
      ).toHaveAttribute('src', UPLOADED),
    );
    expect(upload).toHaveBeenCalledWith(logo);
    expect(update).not.toHaveBeenCalled();

    await save();

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ footerLogoLight: UPLOADED }),
    );
  });

  it('sends null for a logo taken away, to put back the built-in one', async () => {
    const update = mockSettings();
    renderPage();
    await screen.findByAltText('Header logo · dark mode preview');

    await userEvent.click(screen.getAllByRole('button', { name: 'Clear' })[1]);
    await save();

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ headerLogoDark: null }),
    );
  });

  it('saves wording, and blank wording as null', async () => {
    const update = mockSettings();
    renderPage();
    const tagline = await screen.findByRole('textbox', { name: 'Tagline' });

    await userEvent.type(tagline, 'Carved in Kumaon');
    await userEvent.clear(screen.getByRole('textbox', { name: 'Note' }));
    await save();

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        footerTagline: 'Carved in Kumaon',
        footerNote: null,
      }),
    );
  });

  it('stops wording over its limit', async () => {
    const update = mockSettings();
    renderPage();
    const tagline = await screen.findByRole('textbox', { name: 'Tagline' });

    await userEvent.click(tagline);
    await userEvent.paste('x'.repeat(81));
    await save();

    expect(
      await screen.findByText('Tagline must be 80 characters or fewer'),
    ).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it('turns away a file that cannot be a logo before uploading it', async () => {
    mockSettings();
    const error = vi.spyOn(toast, 'error');
    const upload = vi.spyOn(uploadService, 'brandImage');
    renderPage();
    await screen.findByAltText('Header logo · light mode preview');
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(
      fileInputs()[0],
      new File(['gif'], 'logo.gif', { type: 'image/gif' }),
    );
    await user.upload(
      fileInputs()[0],
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'huge.png', {
        type: 'image/png',
      }),
    );

    expect(error).toHaveBeenNthCalledWith(
      1,
      'Use a PNG, JPG, WebP, SVG or ICO file',
    );
    expect(error).toHaveBeenNthCalledWith(2, 'huge.png is over 2MB');
    expect(upload).not.toHaveBeenCalled();
  });

  it('warns about a favicon that is not square', async () => {
    mockSettings({
      ...SETTINGS,
      favicon: 'https://example.com/wide.png',
    });
    renderPage();
    const favicon = await screen.findByAltText('Favicon preview');

    Object.defineProperty(favicon, 'naturalWidth', { value: 400 });
    Object.defineProperty(favicon, 'naturalHeight', { value: 100 });
    favicon.dispatchEvent(new Event('load'));

    expect(await screen.findByText(/isn't square/)).toBeInTheDocument();
  });
});
