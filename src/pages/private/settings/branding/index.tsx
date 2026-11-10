import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState } from 'react-hook-form';
import { AppWindow, House, LogIn, PanelBottom, PanelTop } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import FormActionBar from '@/components/custom/FormActionBar';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { applyApiFieldErrors, pickChangedFields } from '@/helpers/form';
import { useSettings, useUpdateSettings } from '@/hooks/settings';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import type { StoreSettings, UpdateSettingsPayload } from '@/types/api';

import SettingsSection from '../components/SettingsSection';
import BrandImageField from './components/BrandImageField';
import BrandTextField from './components/BrandTextField';
import {
  BRANDING_DEFAULT_TEXT as DEFAULTS,
  BRANDING_FIELDS,
  BRANDING_FORM_FIELD_NAMES as FIELDS,
  BRANDING_LIMITS as LIMITS,
} from './constants';
import { brandingFormSchema } from './schemas';
import type { TBrandingFormData } from './types';

const LOGO_HINT =
  'A PNG or SVG with a transparent background works best, about 400 × 120.';

const toFormData = (settings: StoreSettings | undefined) =>
  Object.fromEntries(
    BRANDING_FIELDS.map((field) => [field, settings?.[field] ?? '']),
  ) as TBrandingFormData;

const BrandingSettingsPage = () => {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<TBrandingFormData>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: toFormData(settings.data),
  });

  useEffect(() => {
    if (settings.data) form.reset(toFormData(settings.data));
  }, [settings.data, form]);

  // useFormState (not form.formState) so the React Compiler sees fresh state.
  const { isDirty } = useFormState({ control: form.control });
  useUnsavedChangesWarning(isDirty && !updateSettings.isPending);

  const handleSubmit = (data: TBrandingFormData) => {
    const changed = pickChangedFields(toFormData(settings.data), data);
    if (Object.keys(changed).length === 0) return;

    // Blank puts back the storefront's own
    const payload: UpdateSettingsPayload = Object.fromEntries(
      Object.entries(changed).map(([field, value]) => [field, value || null]),
    );

    updateSettings.mutate(payload, {
      onError: (error) => applyApiFieldErrors(form, error),
    });
  };

  if (settings.isPending) {
    return (
      <div className="flex flex-col gap-6" role="status" aria-label="Loading">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const disabled = updateSettings.isPending;

  return (
    <div className="flex flex-col gap-6">
      <Callout variant="info" size="md">
        Everything here is optional — anything left empty keeps the storefront's
        built-in logo and wording. Shoppers see what you save within a few
        minutes.
      </Callout>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          <SettingsSection
            icon={<PanelTop />}
            title="Header logo"
            description="At the top of every page. With only one added, it's used in both light and dark mode."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BrandImageField
                name={FIELDS.HEADER_LOGO_LIGHT}
                label="Header logo · light mode"
                description={LOGO_HINT}
                surface="light"
                disabled={disabled}
              />
              <BrandImageField
                name={FIELDS.HEADER_LOGO_DARK}
                label="Header logo · dark mode"
                description="A light-coloured version, to read on a dark background."
                surface="dark"
                disabled={disabled}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<AppWindow />}
            title="Favicon"
            description="The small icon on the browser tab."
            contentClassName="sm:max-w-sm"
          >
            <BrandImageField
              name={FIELDS.FAVICON}
              label="Favicon"
              description="Square works best — a PNG, ICO or SVG of at least 180 × 180."
              square
              disabled={disabled}
            />
          </SettingsSection>

          <SettingsSection
            icon={<PanelBottom />}
            title="Footer"
            description="The logo and wording at the bottom of every page."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BrandImageField
                name={FIELDS.FOOTER_LOGO_LIGHT}
                label="Footer logo · light mode"
                description="Left empty, the footer uses the header logo."
                surface="light"
                emptyLabel="Using the header logo"
                disabled={disabled}
              />
              <BrandImageField
                name={FIELDS.FOOTER_LOGO_DARK}
                label="Footer logo · dark mode"
                surface="dark"
                emptyLabel="Using the header logo"
                disabled={disabled}
              />
            </div>
            <BrandTextField
              name={FIELDS.FOOTER_TAGLINE}
              label="Tagline"
              max={LIMITS.FOOTER_TAGLINE_MAX}
              placeholder={DEFAULTS.FOOTER_TAGLINE}
              description="Under the logo."
              disabled={disabled}
            />
            <BrandTextField
              name={FIELDS.FOOTER_ABOUT}
              label="Description"
              max={LIMITS.FOOTER_ABOUT_MAX}
              placeholder={DEFAULTS.FOOTER_ABOUT}
              multiline
              disabled={disabled}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BrandTextField
                name={FIELDS.FOOTER_COPYRIGHT}
                label="Copyright line"
                max={LIMITS.FOOTER_COPYRIGHT_MAX}
                placeholder={DEFAULTS.FOOTER_COPYRIGHT}
                description="{{year}} becomes the current year."
                disabled={disabled}
              />
              <BrandTextField
                name={FIELDS.FOOTER_NOTE}
                label="Note"
                max={LIMITS.FOOTER_NOTE_MAX}
                placeholder={DEFAULTS.FOOTER_NOTE}
                description="Beside the copyright line."
                disabled={disabled}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<House />}
            title="Home page"
            description="The picture beside the headline at the top of the home page."
            contentClassName="sm:max-w-sm"
          >
            <BrandImageField
              name={FIELDS.HERO_IMAGE}
              label="Hero image"
              description="Replaces the product photos. A 4:3 landscape shot fits best."
              photo
              emptyLabel="Using your featured product photos"
              disabled={disabled}
            />
          </SettingsSection>

          <SettingsSection
            icon={<LogIn />}
            title="Sign-in page"
            description="The brand panel beside the sign-in and sign-up forms on larger screens. It's the same colour in light and dark mode."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BrandImageField
                name={FIELDS.AUTH_LOGO}
                label="Panel logo"
                description="Left empty, the panel uses the dark mode header logo."
                surface="brand"
                emptyLabel="Using the header logo"
                disabled={disabled}
              />
              <BrandImageField
                name={FIELDS.AUTH_IMAGE}
                label="Background image"
                description="Darkened a little, so the wording stays readable."
                photo
                emptyLabel="Using the built-in mountains"
                disabled={disabled}
              />
            </div>
            <BrandTextField
              name={FIELDS.AUTH_HEADLINE}
              label="Headline"
              max={LIMITS.AUTH_HEADLINE_MAX}
              placeholder={DEFAULTS.AUTH_HEADLINE}
              disabled={disabled}
            />
            <BrandTextField
              name={FIELDS.AUTH_DESCRIPTION}
              label="Text"
              max={LIMITS.AUTH_DESCRIPTION_MAX}
              placeholder={DEFAULTS.AUTH_DESCRIPTION}
              multiline
              disabled={disabled}
            />
          </SettingsSection>

          <FormActionBar
            isDirty={isDirty}
            isPending={updateSettings.isPending}
            submitLabel="Save changes"
            secondaryLabel="Reset"
            onSecondary={() => form.reset(toFormData(settings.data))}
            secondaryRequiresDirty
          />
        </form>
      </Form>
    </div>
  );
};

export default BrandingSettingsPage;
