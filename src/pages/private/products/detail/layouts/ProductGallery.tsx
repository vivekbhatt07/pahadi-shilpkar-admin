import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { cn } from '@/lib/utils';

type TProductGalleryProps = {
  images: string[];
  name: string;
  /** Under the thumbnails — e.g. which variant's photos these are. */
  caption?: React.ReactNode;
};

const navButtonClass =
  'absolute top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-white/80 text-stone-700 shadow-md backdrop-blur transition-all duration-200 hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-500/30 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200 dark:hover:bg-stone-900 opacity-0 group-hover:opacity-100';

const ProductGallery = ({ images, name, caption }: TProductGalleryProps) => {
  const [active, setActive] = useState(0);
  const count = images.length;
  const current = images[active] ?? images[0];
  const hasMany = count > 1;

  const go = (delta: number) =>
    setActive((index) => (index + delta + count) % count);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasMany) return;
    if (event.key === 'ArrowLeft') go(-1);
    if (event.key === 'ArrowRight') go(1);
  };

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-4">
      <div
        className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-accent-500/20 dark:border-stone-700/60 dark:bg-stone-900"
        tabIndex={hasMany ? 0 : undefined}
        onKeyDown={handleKeyDown}
        aria-roledescription={hasMany ? 'carousel' : undefined}
        aria-label={hasMany ? `${name} images` : undefined}
      >
        <ImageThumb
          key={current}
          src={current}
          alt={name}
          rounded="lg"
          className="aspect-square w-full animate-in border-0 duration-300 fade-in-0 [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-[1.03]"
        />
        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className={cn(navButtonClass, 'left-3')}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className={cn(navButtonClass, 'right-3')}
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-stone-950/60 px-2 py-0.5 text-[11px] font-medium text-white tabular-nums backdrop-blur">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>
      {hasMany && (
        <div className="flex gap-2 overflow-x-auto p-1">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === active}
              className={cn(
                'shrink-0 cursor-pointer rounded-md ring-2 ring-offset-2 ring-offset-stone-50 transition-all duration-200 dark:ring-offset-stone-950',
                index === active
                  ? 'ring-accent-500 dark:ring-accent-400'
                  : 'opacity-70 ring-transparent hover:opacity-100 hover:ring-stone-300 dark:hover:ring-stone-600',
              )}
            >
              <ImageThumb src={url} alt="" className="size-14" />
            </button>
          ))}
        </div>
      )}
      {caption}
    </div>
  );
};

export default ProductGallery;
