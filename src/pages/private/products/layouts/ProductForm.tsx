import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';

import Callout from '@/components/custom/Callout';
import CategoryTreePicker from '@/components/custom/CategoryTreePicker';
import FormActionBar from '@/components/custom/FormActionBar';
import ImagesInput from '@/components/custom/ImagesInput';
import TagsInput from '@/components/custom/TagsInput';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import type { Product } from '@/types/api';

import {
  AVAILABILITY_OPTIONS,
  DEACTIVATE_WARNING,
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
} from '../constants';
import { productFormSchema } from '../schemas';
import type { TProductFormData, TProductFormMode } from '../types';
import HighlightsField from './HighlightsField';
import PurchaseLinksField from './PurchaseLinksField';
import SpecificationsField from './SpecificationsField';

type TProductFormProps = {
  mode: TProductFormMode;
  defaultValues: TProductFormData;
  /** The product being edited (for slug/discount/whatsappUrl display). */
  product?: Product;
  isPending: boolean;
  onSubmit: (
    data: TProductFormData,
    form: UseFormReturn<TProductFormData>,
  ) => void;
  onCancel: () => void;
};

/** `valueAsNumber` semantics for a controlled input: NaN while empty. */
const toNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? Number.NaN : event.target.valueAsNumber;

const numberValue = (value: number) => (Number.isNaN(value) ? '' : value);

const toNullableNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? null : event.target.valueAsNumber;

const nullableNumberValue = (value: number | null) =>
  value === null ? '' : value;

const RupeePrefix = () => (
  <span className="text-sm text-stone-400 dark:text-stone-500">₹</span>
);

const ProductForm = ({
  mode,
  defaultValues,
  product,
  isPending,
  onSubmit,
  onCancel,
}: TProductFormProps) => {
  const isEdit = mode === 'edit';
  const {
    NAME,
    SLUG,
    SKU,
    SHORT_DESCRIPTION,
    DESCRIPTION,
    HIGHLIGHTS,
    PRICE,
    COMPARE_AT_PRICE,
    IMAGES,
    VIDEO_URL,
    MATERIAL,
    DIMENSIONS,
    WEIGHT,
    CARE_INSTRUCTIONS,
    TAGS,
    STOCK,
    AVAILABILITY,
    IS_FEATURED,
    IS_BESTSELLER,
    IS_ACTIVE,
    WHATSAPP_MESSAGE,
    META_TITLE,
    META_DESCRIPTION,
    CATEGORY_ID,
  } = PRODUCT_FORM_FIELD_NAMES;

  const form = useForm<TProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const nameValue = form.watch(NAME);
  const slugValue = form.watch(SLUG);
  const shortDescriptionValue = form.watch(SHORT_DESCRIPTION) ?? '';
  const descriptionValue = form.watch(DESCRIPTION) ?? '';
  const careInstructionsValue = form.watch(CARE_INSTRUCTIONS) ?? '';
  const whatsappMessageValue = form.watch(WHATSAPP_MESSAGE) ?? '';
  const metaTitleValue = form.watch(META_TITLE) ?? '';
  const metaDescriptionValue = form.watch(META_DESCRIPTION) ?? '';
  const priceValue = form.watch(PRICE);
  const compareAtPriceValue = form.watch(COMPARE_AT_PRICE);
  const isActiveValue = form.watch(IS_ACTIVE);
  const isDirty = form.formState.isDirty;
  useUnsavedChangesWarning(isDirty && !isPending);

  // Live preview of the storefront discount badge while typing.
  const liveDiscount =
    compareAtPriceValue !== null &&
    !Number.isNaN(priceValue) &&
    priceValue > 0 &&
    compareAtPriceValue > priceValue
      ? Math.round((1 - priceValue / compareAtPriceValue) * 100)
      : null;
  const isRenaming = isEdit && product && nameValue.trim() !== product.name;
  const isSlugChanged =
    isEdit && product && slugValue.trim() !== (product.slug ?? '');

  const imageErrors = form.formState.errors.images;
  const imageItemErrors = Array.isArray(imageErrors)
    ? imageErrors.map((error) => error?.message)
    : undefined;

  const highlightErrors = form.formState.errors.highlights;
  const highlightItemErrors = Array.isArray(highlightErrors)
    ? highlightErrors.map((error) => error?.message)
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
                  control={form.control}
                  name={NAME}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Hand-carved Deodar Wall Panel"
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
                  control={form.control}
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
                          placeholder="Shown on product cards and teasers…"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                          rows={8}
                          placeholder="Materials, dimensions, the artisan story…"
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
                <CardTitle>Highlights</CardTitle>
                <CardDescription>
                  Short bullet points shown near the price.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name={HIGHLIGHTS}
                  render={({ field }) => (
                    <FormItem>
                      <HighlightsField
                        value={field.value}
                        onChange={field.onChange}
                        itemErrors={highlightItemErrors}
                        disabled={isPending}
                      />
                      {!Array.isArray(highlightErrors) && <FormMessage />}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images & video</CardTitle>
                <CardDescription>
                  Order here is the display order on the storefront. The first
                  image is the primary one.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
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
                <FormField
                  control={form.control}
                  name={VIDEO_URL}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Video URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://youtube.com/watch?v=…"
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
                <CardTitle>Craft details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={MATERIAL}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel optional>Material</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Deodar wood"
                            maxLength={PRODUCT_LIMITS.MATERIAL_MAX}
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={DIMENSIONS}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel optional>Dimensions</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="30 × 30 × 2 cm"
                            maxLength={PRODUCT_LIMITS.DIMENSIONS_MAX}
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={WEIGHT}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel optional>Weight</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="450 g"
                            maxLength={PRODUCT_LIMITS.WEIGHT_MAX}
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={CARE_INSTRUCTIONS}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel optional>Care instructions</FormLabel>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {careInstructionsValue.length}/
                          {PRODUCT_LIMITS.CARE_INSTRUCTIONS_MAX}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Wipe with a dry cloth. Avoid direct sunlight…"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                    Specifications
                  </p>
                  <SpecificationsField disabled={isPending} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Where to buy</CardTitle>
                <CardDescription>
                  External marketplaces and the WhatsApp message override for
                  this product.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <PurchaseLinksField disabled={isPending} />

                <FormField
                  control={form.control}
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
                        Supports {'{{productName}}'}, {'{{price}}'} and{' '}
                        {'{{productUrl}}'}.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEdit &&
                  (product?.whatsappUrl ? (
                    <a
                      href={product.whatsappUrl}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                      {isEdit && product && (
                        <FormDescription>
                          Current slug:{' '}
                          <span className="font-mono">{product.slug}</span>
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
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & stock</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name={PRICE}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Price</FormLabel>
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

                <FormField
                  control={form.control}
                  name={COMPARE_AT_PRICE}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Compare-at price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="MRP / strike-through price"
                          disabled={isPending}
                          startAdornment={<RupeePrefix />}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={nullableNumberValue(field.value)}
                          onChange={(event) =>
                            field.onChange(toNullableNumber(event))
                          }
                        />
                      </FormControl>
                      {liveDiscount !== null && (
                        <FormDescription className="flex animate-in items-center gap-1.5 fade-in-0">
                          Storefront shows a
                          <Badge variant="destructive">
                            {liveDiscount}% off
                          </Badge>
                          badge.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={STOCK}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          placeholder="0"
                          disabled={isPending}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={numberValue(field.value)}
                          onChange={(event) => field.onChange(toNumber(event))}
                        />
                      </FormControl>
                      <FormDescription>Whole units available.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={AVAILABILITY}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Availability</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Independent of stock — set this to what buyers should
                        see. Saving as In stock or Made to order emails anyone
                        waiting on a “Notify me” alert.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organisation</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name={CATEGORY_ID}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Category</FormLabel>
                      <FormControl>
                        <CategoryTreePicker
                          value={field.value || null}
                          onChange={(value) => field.onChange(value ?? '')}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={SKU}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>SKU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PS-WOOD-001"
                          maxLength={PRODUCT_LIMITS.SKU_MAX}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={TAGS}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Tags</FormLabel>
                      <FormControl>
                        <TagsInput
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          maxTags={PRODUCT_LIMITS.TAGS_MAX}
                          maxTagLength={PRODUCT_LIMITS.TAG_MAX}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={IS_FEATURED}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <FormLabel>Featured</FormLabel>
                          <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                            Highlight on the storefront
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

                <FormField
                  control={form.control}
                  name={IS_BESTSELLER}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <FormLabel>Bestseller</FormLabel>
                          <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                            Shown with a bestseller badge
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
                    control={form.control}
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
                            {DEACTIVATE_WARNING}
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
          submitLabel={isEdit ? 'Save changes' : 'Create product'}
          secondaryLabel="Cancel"
          onSecondary={onCancel}
          allowCleanSubmit
        />
      </form>
    </Form>
  );
};

export default ProductForm;
