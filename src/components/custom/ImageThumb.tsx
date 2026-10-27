import { useState } from 'react';
import { ImageOff } from 'lucide-react';

import {
  resizedImage,
  type TImageAspect,
  type TImageWidth,
} from '@/helpers/image';
import { cn } from '@/lib/utils';

type TImageThumbProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  rounded?: 'md' | 'lg' | 'full';
  /**
   * The copy asked of Cloudinary — by default 320px square, the storefront's
   * own thumbnail. A big box asks for more pixels; one much wider than it is
   * tall shows the photo uncropped (`aspect={null}`).
   */
  width?: TImageWidth;
  aspect?: TImageAspect | null;
};

const roundedClass = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

const ImageThumb = ({
  src,
  alt,
  className,
  rounded = 'md',
  width = 320,
  aspect = '1:1',
}: TImageThumbProps) => {
  // The resized copy, then the original — one Cloudinary couldn't make
  // mustn't hide the photo — then the placeholder
  const candidates = src
    ? [...new Set([resizedImage(src, width, aspect ?? undefined), src])]
    : [];
  const [failed, setFailed] = useState<string[]>([]);
  const current = candidates.find((url) => !failed.includes(url));

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800',
        roundedClass[rounded],
        className,
      )}
    >
      {current ? (
        <img
          key={current}
          src={current}
          alt={alt}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed((urls) => [...urls, current])}
        />
      ) : (
        <ImageOff className="size-[40%] text-stone-400" aria-hidden />
      )}
    </div>
  );
};

export default ImageThumb;
