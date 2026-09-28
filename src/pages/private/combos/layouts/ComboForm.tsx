import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  useFormState,
  useWatch,
  type UseFormReturn,
} from 'react-hook-form';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';

import Callout from '@/components/custom/Callout';
import FormActionBar from '@/components/custom/FormActionBar';
import ImagesInput from '@/components/custom/ImagesInput';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import type { Combo } from '@/types/api';

import { PRODUCT_LIMITS } from '../../products/constants';
import {
  AVAILABILITY_LABELS,
  availabilityVariant,
} from '../../products/helpers';
import PurchaseLinksField from '../../products/layouts/PurchaseLinksField';
import {
  COMBO_DEACTIVATE_WARNING,
  COMBO_FORM_FIELD_NAMES,
  COMBO_HIDDEN_BY_PRODUCT_WARNING,
} from '../constants';
import { summarizeCombo } from '../helpers';
import { comboFormSchema } from '../schemas';
import type { TComboFormData, TComboFormMode } from '../types';
import ComboItemsField from './ComboItemsField';

type TComboFormProps = {
  mode: TComboFormMode;
  defaultValues: TComboFormData;
  /** The combo being edited (for slug/whatsappUrl display). */
  combo?: Combo;
  isPending: boolean;
  onSubmit: (data: TComboFormData, form: UseFormReturn<TComboFormData>) => void;
  onCancel: () => void;
};

/** `valueAsNumber` semantics for a controlled input: NaN while empty. */
const toNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? Number.NaN : event.target.valueAsNumber;

const numberValue = (value: number) => (Number.isNaN(value) ? '' : value);

const RupeePrefix = () => (
  <span className="text-sm text-stone-400 dark:text-stone-500">₹</span>
);

const SummaryRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="text-stone-500 dark:text-stone-400">{label}</span>
    <span className="font-medium tabular-nums text-stone-900 dark:text-stone-50">
      {children}
    </span>
  </div>
);

const ComboForm = ({
  mode,
  defaultValues,
  combo,
  isPending,
  onSubmit,
  onCancel,
}: TComboFormProps) => {
  const isEdit = mode === 'edit';
  const {
    NAME,
    SLUG,
    SHORT_DESCRIPTION,
    DESCRIPTION,
    PRICE,
    IMAGES,
    ITEMS,
    IS_FEATURED,
    IS_ACTIVE,
    WHATSAPP_MESSAGE,
    META_TITLE,
    META_DESCRIPTION,
  } = COMBO_FORM_FIELD_NAMES;

  const form = useForm<TComboFormData>({
    resolver: zodResolver(comboFormSchema),
    defaultValues,
  });
  const { control } = form;

  const nameValue = useWatch({ control, name: NAME });
  const slugValue = useWatch({ control, name: SLUG });
  const shortDescriptionValue = useWatch({ control, name: SHORT_DESCRIPTION });
  const descriptionValue = useWatch({ control, name: DESCRIPTION });
  const whatsappMessageValue = useWatch({ control, name: WHATSAPP_MESSAGE });
  const metaTitleValue = useWatch({ control, name: META_TITLE });
  const metaDescriptionValue = useWatch({ control, name: META_DESCRIPTION });
  const priceValue = useWatch({ control, name: PRICE });
  const itemsValue = useWatch({ control, name: ITEMS });
  const isActiveValue = useWatch({ control, name: IS_ACTIVE });
  // useFormState (not form.formState) so the React Compiler sees fresh state.
  const { isDirty, errors } = useFormState({ control });
  useUnsavedChangesWarning(isDirty && !isPending);

  const summary = summarizeCombo(itemsValue, priceValue);
  const hasItems = itemsValue.length > 0;
  const hasPrice = Number.isFinite(priceValue) && priceValue > 0;
  const isRenaming = isEdit && combo && nameValue.trim() !== combo.name;
  const isSlugChanged = isEdit && combo && slugValue.trim() !== combo.slug;

  const imageErrors = errors.images;
  const imageItemErrors = Array.isArray(imageErrors)
    ? imageErrors.map((error) => error?.message)
    : undefined;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data, form))}
        className="flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>
                  The slug is generated from the name unless you set a custom
                  one.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={control}
                  name={NAME}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Diwali Pooja Set"
                          maxLength={PRODUCT_LIMITS.NAME_MAX}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isRenaming && (
                  <Callout variant="warning">
                    Renaming regenerates the slug (unless you set a custom one
                    below) and{' '}
                    <span className="font-medium">
                      breaks existing storefront URLs
                    </span>
                    .
                  </Callout>
                )}

                <FormField
                  control={control}
                  name={SHORT_DESCRIPTION}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel optional>Short description</FormLabel>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {shortDescriptionValue.length}/
                          {PRODUCT_LIMITS.SHORT_DESCRIPTION_MAX}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Shown on combo cards…"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={DESCRIPTION}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel optional>Description</FormLabel>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {descriptionValue.length}/
                          {PRODUCT_LIMITS.DESCRIPTION_MAX}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          rows={6}
                          placeholder="Who it's for, the occasion, how it's packed…"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What's inside</CardTitle>
                <CardDescription>
                  Prices and availability come from each product, so they stay
                  in sync when a product changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComboItemsField disabled={isPending} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>
                  Optional. Without photos of its own, the storefront shows the
                  products' photos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={control}
                  name={IMAGES}
                  render={({ field }) => (
                    <FormItem>
                      <ImagesInput
                        value={field.value}
                        onChange={field.onChange}
                        itemErrors={imageItemErrors}
                        disabled={isPending}
                      />
                      {!Array.isArray(imageErrors) && <FormMessage />}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Where to buy</CardTitle>
                <CardDescription>
                  External marketplaces and the WhatsApp message override for
                  this combo.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <PurchaseLinksField disabled={isPending} />

                <FormField
                  control={control}
                  name={WHATSAPP_MESSAGE}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel optional>
                          WhatsApp message override
                        </FormLabel>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {whatsappMessageValue.length}/
                          {PRODUCT_LIMITS.WHATSAPP_MESSAGE_MAX}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Leave blank to use the store's default template"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Supports {'{{productName}}'} (the combo name),{' '}
                        {'{{price}}'} and {'{{productUrl}}'} (the combo page).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEdit &&
                  (combo?.whatsappUrl ? (
                    <a
                      href={combo.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-fit items-center gap-1.5 text-xs font-medium text-accent-600 hover:underline dark:text-accent-400"
                    >
                      Test WhatsApp link
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      Set a WhatsApp number in{' '}
                      <Link
                        to={ROUTES.PRIVATE.SETTINGS.STORE}
                        className="underline underline-offset-2"
                      >
                        Store settings
                      </Link>{' '}
                      to enable the buy button.
                    </p>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={control}
                  name={META_TITLE}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel optional>Meta title</FormLabel>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {metaTitleValue.length}/
                          {PRODUCT_LIMITS.META_TITLE_MAX}
                        </span>
                      </div>
                      <FormControl>
                        <Input
                          maxLength={PRODUCT_LIMITS.META_TITLE_MAX}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={META_DESCRIPTION}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel optional>Meta description</FormLabel>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {metaDescriptionValue.length}/
                          {PRODUCT_LIMITS.META_DESCRIPTION_MAX}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          rows={2}
                          maxLength={PRODUCT_LIMITS.META_DESCRIPTION_MAX}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={SLUG}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Custom slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Leave blank to auto-generate from the name"
                          maxLength={PRODUCT_LIMITS.SLUG_MAX}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      {isEdit && combo && (
                        <FormDescription>
                          Current slug:{' '}
                          <span className="font-mono">{combo.slug}</span>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isSlugChanged && !isRenaming && (
                  <Callout variant="warning">
                    Changing the slug{' '}
                    <span className="font-medium">
                      breaks existing storefront URLs
                    </span>
                    .
                  </Callout>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={control}
                  name={PRICE}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Combo price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          disabled={isPending}
                          startAdornment={<RupeePrefix />}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={numberValue(field.value)}
                          onChange={(event) => field.onChange(toNumber(event))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {hasItems && (
                  <div className="flex flex-col gap-2 rounded-lg bg-stone-50 px-3 py-3 dark:bg-stone-800/40">
                    <SummaryRow label={`Items (${summary.itemCount})`}>
                      {formatPrice(summary.itemsTotal)}
                    </SummaryRow>
                    {hasPrice && (
                      <SummaryRow label="Combo price">
                        {formatPrice(priceValue)}
                      </SummaryRow>
                    )}
                    {summary.savings !== null && (
                      <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-2 text-sm dark:border-stone-700">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          Customers save {formatPrice(summary.savings)}
                        </span>
                        <Badge variant="destructive">
                          {summary.discountPercentage}% off
                        </Badge>
                      </div>
                    )}
                    <SummaryRow label="Availability">
                      <Badge
                        variant={availabilityVariant(summary.availability)}
                      >
                        {AVAILABILITY_LABELS[summary.availability]}
                      </Badge>
                    </SummaryRow>
                  </div>
                )}

                {hasItems && hasPrice && summary.savings === null && (
                  <Callout variant="warning">
                    The combo costs as much as its items bought separately (
                    {formatPrice(summary.itemsTotal)}) — customers save nothing.
                  </Callout>
                )}

                {summary.inactiveProducts.length > 0 && (
                  <Callout variant="warning">
                    Hidden from the storefront while{' '}
                    <span className="font-medium">
                      {summary.inactiveProducts
                        .map((product) => product.name)
                        .join(', ')}
                    </span>{' '}
                    {summary.inactiveProducts.length === 1 ? 'is' : 'are'}{' '}
                    inactive. {COMBO_HIDDEN_BY_PRODUCT_WARNING}
                  </Callout>
                )}

                <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                  The availability shown to buyers is the least available
                  item's.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visibility</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={control}
                  name={IS_FEATURED}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <FormLabel>Featured</FormLabel>
                          <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                            Shown in the home page combo rail
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                {isEdit && (
                  <FormField
                    control={control}
                    name={IS_ACTIVE}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <FormLabel>Active</FormLabel>
                            <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                              Visible on the storefront
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                        </div>
                        {!isActiveValue && (
                          <Callout variant="danger" className="mt-1">
                            {COMBO_DEACTIVATE_WARNING}
                          </Callout>
                        )}
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <FormActionBar
          isDirty={isDirty}
          isPending={isPending}
          submitLabel={isEdit ? 'Save changes' : 'Create combo'}
          secondaryLabel="Cancel"
          onSecondary={onCancel}
          allowCleanSubmit
        />
      </form>
    </Form>
  );
};

export default ComboForm;
