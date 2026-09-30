import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ArrowRight, Loader2 } from 'lucide-react';

import ImageUrlInput from '@/components/custom/ImageUrlInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { applyApiFieldErrors, pickChangedFields } from '@/helpers/form';
import { isValidUrl } from '@/helpers/format';
import { useCreateBanner, useUpdateBanner } from '@/hooks/banners';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { Banner } from '@/types/api';

import { BANNER_FORM_FIELD_NAMES, BANNER_LIMITS } from '../constants';
import { toBannerFormData, toBannerPayload } from '../helpers';
import { bannerFormSchema } from '../schemas';
import type { TBannerFormData } from '../types';

type TBannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits; otherwise it creates. */
  banner?: Banner | null;
};

const {
  TITLE,
  SUBTITLE,
  IMAGE,
  MOBILE_IMAGE,
  CTA_LABEL,
  CTA_URL,
  STARTS_AT,
  ENDS_AT,
  IS_ACTIVE,
} = BANNER_FORM_FIELD_NAMES;

const CharacterCount = ({ value, max }: { value: string; max: number }) => (
  <span className="text-xs text-stone-400 tabular-nums dark:text-stone-500">
    {value.length}/{max}
  </span>
);

/** Roughly how the storefront shows the slide on a wide screen. */
const SlidePreview = ({
  image,
  title,
  subtitle,
  ctaLabel,
}: {
  image: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
}) => (
  <figure className="flex flex-col gap-1.5">
    <div className="relative aspect-3/1 overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800">
      {isValidUrl(image) && (
        <img
          // A new URL gets a fresh element, so an earlier failure doesn't stick
          key={image}
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden';
          }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-stone-950/70 via-stone-950/25 to-transparent"
      />
      <div className="relative flex h-full max-w-[70%] flex-col justify-center gap-1 px-4">
        <p className="line-clamp-2 text-sm leading-tight font-medium text-white sm:text-base">
          {title || 'Your headline'}
        </p>
        {subtitle && (
          <p className="line-clamp-1 text-[11px] text-white/85">{subtitle}</p>
        )}
        {ctaLabel && (
          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-stone-900">
            {ctaLabel}
            <ArrowRight className="size-2.5" />
          </span>
        )}
      </div>
    </div>
    <figcaption className="text-xs text-stone-500 dark:text-stone-400">
      Preview — a wide screen crops the image like this.
    </figcaption>
  </figure>
);

const BannerDialog = ({ open, onOpenChange, banner }: TBannerDialogProps) => {
  const isEdit = Boolean(banner);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const isPending = createBanner.isPending || updateBanner.isPending;

  const form = useForm<TBannerFormData>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: toBannerFormData(banner),
  });

  useEffect(() => {
    if (open) form.reset(toBannerFormData(banner));
  }, [open, banner, form]);

  const [title, subtitle, image, ctaLabel] = useWatch({
    control: form.control,
    name: [TITLE, SUBTITLE, IMAGE, CTA_LABEL],
  });
  // Typing a URL shouldn't fetch every half-typed version of it
  const previewImage = useDebouncedValue(image, 400);

  const handleClose = () => {
    if (!isPending) onOpenChange(false);
  };

  const handleSubmit = (data: TBannerFormData) => {
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => {
        applyApiFieldErrors(form, error);
      },
    };

    if (banner) {
      const changed = pickChangedFields(toBannerFormData(banner), data);
      if (Object.keys(changed).length === 0) {
        onOpenChange(false);
        return;
      }
      updateBanner.mutate(
        { id: banner.id, payload: toBannerPayload(changed) },
        options,
      );
      return;
    }

    createBanner.mutate(
      { ...toBannerPayload(data), title: data.title, image: data.image },
      options,
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-xl md:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit banner' : 'New banner'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Changes show on the home page as soon as you save.'
              : 'New banners go first on the home page — drag them into order afterwards.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-px">
              <SlidePreview
                image={previewImage}
                title={title}
                subtitle={subtitle}
                ctaLabel={ctaLabel}
              />

              <FormField
                control={form.control}
                name={TITLE}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel required>Title</FormLabel>
                      <CharacterCount
                        value={field.value}
                        max={BANNER_LIMITS.TITLE_MAX}
                      />
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Diwali gifting, handmade in the hills"
                        maxLength={BANNER_LIMITS.TITLE_MAX}
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
                name={SUBTITLE}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel optional>Subtitle</FormLabel>
                      <CharacterCount
                        value={field.value}
                        max={BANNER_LIMITS.SUBTITLE_MAX}
                      />
                    </div>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Brass diyas, pooja thalis and gift sets — made to order."
                        maxLength={BANNER_LIMITS.SUBTITLE_MAX}
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
                name={IMAGE}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Image</FormLabel>
                    <FormControl>
                      <ImageUrlInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isPending}
                        alt={title || 'Banner image'}
                      />
                    </FormControl>
                    <FormDescription>
                      A wide photo, 1800 × 600 or larger. Tablets and computers
                      crop it to a strip — keep the subject near the middle.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={MOBILE_IMAGE}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Phone image</FormLabel>
                    <FormControl>
                      <ImageUrlInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isPending}
                        alt={`${title || 'Banner'} on phones`}
                      />
                    </FormControl>
                    <FormDescription>
                      A portrait photo (4:5, e.g. 1080 × 1350) for phones.
                      Without one, phones crop the wide image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-[2fr_3fr]">
                <FormField
                  control={form.control}
                  name={CTA_LABEL}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Button label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Shop the edit"
                          maxLength={BANNER_LIMITS.CTA_LABEL_MAX}
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
                  name={CTA_URL}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Link</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="/products?tag=diwali"
                          maxLength={BANNER_LIMITS.CTA_URL_MAX}
                          disabled={isPending}
                          onClear={() => field.onChange('')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="-mt-2 text-xs text-stone-500 sm:col-span-2 dark:text-stone-400">
                  A storefront path like /products?tag=diwali, or a full link.
                  With a link but no label, the whole slide is clickable.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={STARTS_AT}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Starts</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          onClear={() => field.onChange('')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={ENDS_AT}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Ends</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          onClear={() => field.onChange('')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="-mt-2 text-xs text-stone-500 sm:col-span-2 dark:text-stone-400">
                  In your timezone. Leave both empty to show the banner until
                  you switch it off.
                </p>
              </div>

              <FormField
                control={form.control}
                name={IS_ACTIVE}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2.5 dark:border-stone-700 dark:bg-stone-800/30">
                    <div className="flex flex-col gap-0.5">
                      <FormLabel>On</FormLabel>
                      <FormDescription>
                        Shown on the home page while inside its schedule.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                startAdornment={
                  isPending ? <Loader2 className="animate-spin" /> : undefined
                }
              >
                {isEdit ? 'Save changes' : 'Create banner'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BannerDialog;
