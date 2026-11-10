import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import UploadImageButton from '@/components/custom/UploadImageButton';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { resizedImage, showOriginalOnError } from '@/helpers/image';
import { cn } from '@/lib/utils';

import type { TBrandingFormData } from '../types';

/**
 * The background the image will sit on on the storefront, in its colours —
 * whichever theme this panel is in — so a white logo shows up on a dark one.
 */
const SURFACES = {
  light: { box: 'bg-[#fcfaf6]', text: 'text-stone-400' },
  dark: { box: 'bg-stone-950', text: 'text-stone-500' },
  brand: { box: 'bg-[#8d3d1b]', text: 'text-white/70' },
  plain: {
    box: 'bg-stone-100 dark:bg-stone-800',
    text: 'text-stone-400 dark:text-stone-500',
  },
} as const;

type TBrandImagePreviewProps = {
  src: string;
  label: string;
  surface: keyof typeof SURFACES;
  photo: boolean;
  square: boolean;
  emptyLabel: string;
};

/** Remounted per image (see `key` below), so its state starts over. */
const BrandImagePreview = ({
  src,
  label,
  surface,
  photo,
  square,
  emptyLabel,
}: TBrandImagePreviewProps) => {
  const [failed, setFailed] = useState(false);
  const [isSquare, setIsSquare] = useState(true);
  const colors = SURFACES[surface];

  return (
    <>
      <div
        className={cn(
          'flex h-28 items-center justify-center overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700',
          !photo && 'px-4 py-3',
          colors.box,
        )}
      >
        {!src || failed ? (
          <span className={cn('px-4 text-center text-xs', colors.text)}>
            {failed ? "This image can't be loaded" : emptyLabel}
          </span>
        ) : (
          <img
            src={resizedImage(src, 640)}
            alt={`${label} preview`}
            className={
              photo
                ? 'size-full object-cover'
                : 'max-h-full max-w-full object-contain'
            }
            onError={showOriginalOnError(src, () => setFailed(true))}
            onLoad={({ currentTarget: image }) =>
              setIsSquare(
                // An SVG without a size reports a made-up one
                /\.svg(?:[?#]|$)/i.test(src) ||
                  Math.abs(image.naturalWidth - image.naturalHeight) <= 1,
              )
            }
          />
        )}
      </div>
      {square && !isSquare && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          This image isn't square, so browsers may squash it in the tab.
        </p>
      )}
    </>
  );
};

type TBrandImageFieldProps = {
  name: keyof TBrandingFormData;
  label: string;
  description?: React.ReactNode;
  surface?: keyof typeof SURFACES;
  /** A picture that fills its slot, rather than a logo that sits inside it. */
  photo?: boolean;
  /** Warns about an image that isn't square. */
  square?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
};

/** One image of the storefront's branding: a preview, a link and an upload. */
const BrandImageField = ({
  name,
  label,
  description,
  surface = 'plain',
  photo = false,
  square = false,
  emptyLabel = 'Using the built-in one',
  disabled,
}: TBrandImageFieldProps) => {
  const { control } = useFormContext<TBrandingFormData>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <BrandImagePreview
            key={field.value}
            src={field.value}
            label={label}
            surface={surface}
            photo={photo}
            square={square}
            emptyLabel={emptyLabel}
          />
          <div className="flex items-center gap-2">
            <FormControl>
              <Input
                type="url"
                placeholder="Upload, or paste a link"
                disabled={disabled}
                {...field}
                onClear={() => field.onChange('')}
              />
            </FormControl>
            <UploadImageButton
              variant="brand"
              disabled={disabled}
              onUploaded={([url]) => field.onChange(url)}
            />
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default BrandImageField;
