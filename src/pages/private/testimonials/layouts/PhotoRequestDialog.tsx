import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime, getDisplayName } from '@/helpers/format';
import type {
  AnswerPhotoRequestPayload,
  TestimonialWithListing,
} from '@/types/api';

import { TESTIMONIAL_LIMITS } from '../constants';

type TPhotoRequestDialogProps = {
  open: boolean;
  /** Kept after closing, so the content doesn't vanish mid-animation. */
  testimonial: TestimonialWithListing | null;
  onClose: () => void;
  isPending: boolean;
  onAnswer: (payload: AnswerPhotoRequestPayload) => void;
  onOpenPhoto: (index: number) => void;
};

/** Body in its own component so the note resets each time it opens. */
const PhotoRequestBody = ({
  testimonial,
  onClose,
  isPending,
  onAnswer,
  onOpenPhoto,
}: Omit<TPhotoRequestDialogProps, 'open' | 'testimonial'> & {
  testimonial: TestimonialWithListing;
}) => {
  const [note, setNote] = useState('');
  const [answering, setAnswering] = useState<'APPROVED' | 'DECLINED' | null>(
    null,
  );
  const author = getDisplayName(testimonial.user);
  const request = testimonial.photoRequest;

  const answer = (decision: 'APPROVED' | 'DECLINED') => {
    setAnswering(decision);
    onAnswer(
      decision === 'DECLINED'
        ? { decision, note: note.trim() || null }
        : { decision },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{author} wants to change their photos</DialogTitle>
        <DialogDescription>
          Photos can be added to a testimonial once. Allowing a change lets{' '}
          {author} replace them one more time — the testimonial then waits for
          your approval again, so you'll see the new photos first.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Their photos now
          </p>
          <ul className="flex flex-wrap gap-2">
            {testimonial.images.map((src, index) => (
              <li key={src}>
                <button
                  type="button"
                  onClick={() => onOpenPhoto(index)}
                  aria-label={`See photo ${index + 1}`}
                  className="block cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
                >
                  <ImageThumb
                    src={src}
                    alt=""
                    rounded="lg"
                    className="size-20"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {request && (
          <div className="rounded-lg bg-stone-50 px-3 py-2.5 text-sm dark:bg-stone-800/50">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Asked {formatDateTime(request.requestedAt)}
            </p>
            <p className="mt-1 whitespace-pre-line text-stone-800 dark:text-stone-200">
              {request.reason ? `“${request.reason}”` : 'No reason given.'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="photo-request-note">
              Note if you decline{' '}
              <span className="font-normal text-stone-400">
                (shown to {author})
              </span>
            </Label>
            <span className="text-xs text-stone-400 tabular-nums dark:text-stone-500">
              {note.length}/{TESTIMONIAL_LIMITS.PHOTO_REQUEST_NOTE_MAX}
            </span>
          </div>
          <Textarea
            id="photo-request-note"
            rows={2}
            value={note}
            maxLength={TESTIMONIAL_LIMITS.PHOTO_REQUEST_NOTE_MAX}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional — e.g. these photos show the piece well"
            disabled={isPending}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
          className="sm:mr-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => answer('DECLINED')}
          disabled={isPending}
          startAdornment={
            isPending && answering === 'DECLINED' ? (
              <Loader2 className="animate-spin" />
            ) : undefined
          }
        >
          Decline
        </Button>
        <Button
          type="button"
          onClick={() => answer('APPROVED')}
          disabled={isPending}
          startAdornment={
            isPending && answering === 'APPROVED' ? (
              <Loader2 className="animate-spin" />
            ) : undefined
          }
        >
          Allow one change
        </Button>
      </DialogFooter>
    </>
  );
};

const PhotoRequestDialog = ({
  open,
  testimonial,
  onClose,
  isPending,
  ...props
}: TPhotoRequestDialogProps) => (
  <Dialog
    open={open && testimonial !== null}
    onOpenChange={(next) => !next && !isPending && onClose()}
  >
    <DialogContent className="sm:max-w-lg md:max-w-lg">
      {testimonial && (
        <PhotoRequestBody
          key={testimonial.id}
          testimonial={testimonial}
          onClose={onClose}
          isPending={isPending}
          {...props}
        />
      )}
    </DialogContent>
  </Dialog>
);

export default PhotoRequestDialog;
