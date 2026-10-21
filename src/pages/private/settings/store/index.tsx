import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import {
  CheckCheck,
  Contact,
  MessageCircle,
  PackageCheck,
  Share2,
  Truck,
} from 'lucide-react';

import FormActionBar from '@/components/custom/FormActionBar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { applyApiFieldErrors, pickChangedFields } from '@/helpers/form';
import { formatPrice } from '@/helpers/format';
import { useSettings, useUpdateSettings } from '@/hooks/settings';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import type { StoreSettings, UpdateSettingsPayload } from '@/types/api';

import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  PRODUCT_LIMITS,
} from '../../products/constants';
import DeliveryChargeField from '../../products/layouts/DeliveryChargeField';
import SettingsSection from '../components/SettingsSection';
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  STORE_SETTINGS_FORM_FIELD_NAMES,
  STORE_SETTINGS_LIMITS,
} from './constants';
import { storeSettingsFormSchema } from './schemas';
import type { TStoreSettingsFormData } from './types';

const {
  WHATSAPP_NUMBER,
  WHATSAPP_MESSAGE_TEMPLATE,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  INSTAGRAM_URL,
  FACEBOOK_URL,
  YOUTUBE_URL,
  LOW_STOCK_THRESHOLD,
  SHOW_STOCK_LEFT,
} = STORE_SETTINGS_FORM_FIELD_NAMES;

const toFormData = (
  settings: StoreSettings | undefined,
): TStoreSettingsFormData => ({
  whatsappNumber: settings?.whatsappNumber ?? '',
  whatsappMessageTemplate: settings?.whatsappMessageTemplate ?? '',
  deliveryCharge: settings?.deliveryCharge ?? null,
  deliveryFee: settings?.deliveryFee ?? null,
  contactEmail: settings?.contactEmail ?? '',
  contactPhone: settings?.contactPhone ?? '',
  instagramUrl: settings?.instagramUrl ?? '',
  facebookUrl: settings?.facebookUrl ?? '',
  youtubeUrl: settings?.youtubeUrl ?? '',
  lowStockThreshold: settings?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
  showStockLeft: settings?.showStockLeft ?? true,
});

const renderPreview = (template: string) => {
  const effective = template.trim() || DEFAULT_WHATSAPP_TEMPLATE;
  return effective
    .replaceAll('{{productName}}', 'Hand-carved Deodar Wall Panel')
    .replaceAll('{{price}}', formatPrice(1299))
    .replaceAll(
      '{{productUrl}}',
      'https://yourdomain.com/products/hand-carved-deodar-wall-panel',
    );
};

const StoreSettingsPage = () => {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<TStoreSettingsFormData>({
    resolver: zodResolver(storeSettingsFormSchema),
    defaultValues: toFormData(settings.data),
  });

  useEffect(() => {
    if (settings.data) form.reset(toFormData(settings.data));
  }, [settings.data, form]);

  const { control } = form;
  const templateValue =
    useWatch({ control, name: WHATSAPP_MESSAGE_TEMPLATE }) ?? '';
  // useFormState (not form.formState) so the React Compiler sees fresh state.
  const { isDirty } = useFormState({ control });
  useUnsavedChangesWarning(isDirty && !updateSettings.isPending);

  const handleSubmit = (data: TStoreSettingsFormData) => {
    const changed = pickChangedFields(toFormData(settings.data), data);
    if (Object.keys(changed).length === 0) return;

    const payload: UpdateSettingsPayload = {
      ...(changed.whatsappNumber !== undefined && {
        whatsappNumber: changed.whatsappNumber || null,
      }),
      ...(changed.whatsappMessageTemplate !== undefined && {
        whatsappMessageTemplate: changed.whatsappMessageTemplate || null,
      }),
      // The form clears the fee whenever delivery stops being EXTRA
      ...(changed.deliveryCharge !== undefined && {
        deliveryCharge: changed.deliveryCharge,
      }),
      ...(changed.deliveryFee !== undefined && {
        deliveryFee: changed.deliveryFee,
      }),
      ...(changed.contactEmail !== undefined && {
        contactEmail: changed.contactEmail || null,
      }),
      ...(changed.contactPhone !== undefined && {
        contactPhone: changed.contactPhone || null,
      }),
      ...(changed.instagramUrl !== undefined && {
        instagramUrl: changed.instagramUrl || null,
      }),
      ...(changed.facebookUrl !== undefined && {
        facebookUrl: changed.facebookUrl || null,
      }),
      ...(changed.youtubeUrl !== undefined && {
        youtubeUrl: changed.youtubeUrl || null,
      }),
      ...(changed.lowStockThreshold !== undefined && {
        lowStockThreshold: changed.lowStockThreshold,
      }),
      ...(changed.showStockLeft !== undefined && {
        showStockLeft: changed.showStockLeft,
      }),
    };

    updateSettings.mutate(payload, {
      onError: (error) => applyApiFieldErrors(form, error),
    });
  };

  if (settings.isPending) {
    return (
      <div className="flex flex-col gap-6" role="status" aria-label="Loading">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          <SettingsSection
            icon={<MessageCircle />}
            title="WhatsApp buy button"
            description='Powers the "buy on WhatsApp" link on every product.'
          >
            <FormField
              control={form.control}
              name={WHATSAPP_NUMBER}
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional>WhatsApp number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+91 98765 43210"
                      disabled={updateSettings.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Stored with the country code, digits only. Leave blank to
                    disable the buy button everywhere.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={WHATSAPP_MESSAGE_TEMPLATE}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel optional>Message template</FormLabel>
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {templateValue.length}/
                      {STORE_SETTINGS_LIMITS.WHATSAPP_MESSAGE_TEMPLATE_MAX}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={DEFAULT_WHATSAPP_TEMPLATE}
                      disabled={updateSettings.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Supports {'{{productName}}'}, {'{{price}}'} and{' '}
                    {'{{productUrl}}'}. Leave blank to use the default above.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Preview
              </p>
              {/* Chat-style preview of what the buyer sends */}
              <div className="rounded-xl bg-[#efeae2] p-4 dark:bg-[#0b141a]">
                <div className="ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm leading-relaxed whitespace-pre-line text-stone-800 shadow-sm dark:bg-[#005c4b] dark:text-stone-100">
                  {renderPreview(templateValue)}
                  <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-stone-500 dark:text-stone-300/70">
                    now
                    <CheckCheck className="size-3.5 text-sky-500" />
                  </span>
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Truck />}
            title="Delivery charges"
            description="Shown next to the price of every product and combo that doesn't set its own."
          >
            <DeliveryChargeField
              scope="store"
              disabled={updateSettings.isPending}
            />
          </SettingsSection>

          <SettingsSection
            icon={<PackageCheck />}
            title="Low stock"
            description="When a product or variant counts as running low — unless it sets its own level."
          >
            <FormField
              control={form.control}
              name={LOW_STOCK_THRESHOLD}
              render={({ field }) => (
                <FormItem className="sm:max-w-56">
                  <FormLabel>Low stock at</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={PRODUCT_LIMITS.LOW_STOCK_THRESHOLD_MAX}
                      step={1}
                      disabled={updateSettings.isPending}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ''
                            ? Number.NaN
                            : event.target.valueAsNumber,
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    In stock with this many left, or fewer — flagged on the
                    Variants page.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={SHOW_STOCK_LEFT}
              render={({ field }) => (
                <FormItem>
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-stone-200 px-3 py-2.5 dark:border-stone-800">
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                        Show “Only 3 left” to shoppers
                      </span>
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        Off keeps how many you have to yourself — low stock is
                        still flagged here.
                      </span>
                    </span>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={updateSettings.isPending}
                      />
                    </FormControl>
                  </label>
                </FormItem>
              )}
            />
          </SettingsSection>

          <SettingsSection
            icon={<Contact />}
            title="Contact details"
            description="Shown on the storefront's contact page."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name={CONTACT_EMAIL}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Contact email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="hello@pahadishilpkar.in"
                        disabled={updateSettings.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={CONTACT_PHONE}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Contact phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+91 98765 43210"
                        maxLength={STORE_SETTINGS_LIMITS.CONTACT_PHONE_MAX}
                        disabled={updateSettings.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Share2 />}
            title="Social links"
            description="Linked from the storefront's footer."
          >
            <FormField
              control={form.control}
              name={INSTAGRAM_URL}
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional>Instagram</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://instagram.com/pahadishilpkar"
                      disabled={updateSettings.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={FACEBOOK_URL}
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional>Facebook</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://facebook.com/pahadishilpkar"
                      disabled={updateSettings.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={YOUTUBE_URL}
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional>YouTube</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://youtube.com/@pahadishilpkar"
                      disabled={updateSettings.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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

export default StoreSettingsPage;
