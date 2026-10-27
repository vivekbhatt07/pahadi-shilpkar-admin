import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { resizedImage, showOriginalOnError } from '@/helpers/image';

type TPhotoPreviewDialogProps = {
  /** The photos of one testimonial. */
  photos: string[];
  /** The photo shown; `null` closes the dialog. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  /** Whose photos — "Asha Rawat's photos". */
  title: string;
};

/** A testimonial's photos at full size, to judge them before approving. */
const PhotoPreviewDialog = ({
  photos,
  index,
  onIndexChange,
  title,
}: TPhotoPreviewDialogProps) => {
  const count = photos.length;
  const current =
    index === null || count === 0 ? null : Math.min(index, count - 1);
  const go = (delta: number) =>
    current !== null && onIndexChange((current + delta + count) % count);

  return (
    <Dialog
      open={current !== null}
      onOpenChange={(open) => !open && onIndexChange(null)}
    >
      <DialogContent
        className="sm:max-w-3xl md:max-w-3xl"
        onKeyDown={(event) => {
          if (count < 2) return;
          if (event.key === 'ArrowLeft') go(-1);
          if (event.key === 'ArrowRight') go(1);
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {count > 1
              ? `Photo ${(current ?? 0) + 1} of ${count} — use the arrow keys to see the others.`
              : 'The author took this photo.'}
          </DialogDescription>
        </DialogHeader>

        {current !== null && (
          <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
            <img
              key={photos[current]}
              // The storefront's copy for its photo viewer
              src={resizedImage(photos[current], 1280)}
              alt=""
              onError={showOriginalOnError(photos[current])}
              className="max-h-[65dvh] w-auto object-contain"
            />
            {count > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Previous photo"
                  onClick={() => go(-1)}
                  className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Next photo"
                  onClick={() => go(1)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full"
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PhotoPreviewDialog;
