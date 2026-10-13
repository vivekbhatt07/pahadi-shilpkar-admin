import { useState } from 'react';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { getDisplayName } from '@/helpers/format';
import {
  useAnswerPhotoRequest,
  useDeleteTestimonial,
  useFeatureTestimonial,
  useModerateTestimonials,
} from '@/hooks/testimonials';
import type { TestimonialWithListing } from '@/types/api';

import { toDeleteTestimonialVariables } from './helpers';
import PhotoPreviewDialog from './layouts/PhotoPreviewDialog';
import PhotoRequestDialog from './layouts/PhotoRequestDialog';
import RejectDialog from './layouts/RejectDialog';
import type { TTestimonialActions } from './layouts/TestimonialsTable';

type TModerationOptions = {
  /** After an approval or rejection — e.g. to clear a selection. */
  onModerated?: () => void;
};

/**
 * Everything a testimonial list needs to moderate: the row actions, bulk
 * approve / reject, and the dialogs they open (render `dialogs` once). Shared
 * by the moderation queue and the product and combo pages. Dialogs keep their
 * last target while closing, so their content doesn't vanish mid-animation.
 */
export const useTestimonialModeration = ({
  onModerated,
}: TModerationOptions = {}) => {
  const moderate = useModerateTestimonials();
  const feature = useFeatureTestimonial();
  const answer = useAnswerPhotoRequest();
  const remove = useDeleteTestimonial();

  const [rejecting, setRejecting] = useState<TestimonialWithListing[]>([]);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [deleting, setDeleting] = useState<TestimonialWithListing | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [answering, setAnswering] = useState<TestimonialWithListing | null>(
    null,
  );
  const [isAnswerOpen, setIsAnswerOpen] = useState(false);
  const [preview, setPreview] = useState<{
    testimonial: TestimonialWithListing;
    index: number;
  } | null>(null);

  const approve = (testimonials: TestimonialWithListing[]) =>
    moderate.mutate(
      {
        ids: testimonials.map((testimonial) => testimonial.id),
        status: 'APPROVED',
      },
      { onSuccess: () => onModerated?.() },
    );

  const reject = (testimonials: TestimonialWithListing[]) => {
    setRejecting(testimonials);
    setIsRejectOpen(true);
  };

  const actions: TTestimonialActions = {
    onApprove: (testimonial) => approve([testimonial]),
    onReject: (testimonial) => reject([testimonial]),
    onToggleFeatured: (testimonial) =>
      feature.mutate({
        id: testimonial.id,
        isFeatured: !testimonial.isFeatured,
      }),
    onAnswerPhotoRequest: (testimonial) => {
      setAnswering(testimonial);
      setIsAnswerOpen(true);
    },
    onDelete: (testimonial) => {
      setDeleting(testimonial);
      setIsDeleteOpen(true);
    },
    onOpenPhoto: (testimonial, index) => setPreview({ testimonial, index }),
  };

  const dialogs = (
    <>
      <RejectDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        count={rejecting.length}
        authorName={
          rejecting.length === 1 ? getDisplayName(rejecting[0].user) : undefined
        }
        isPending={moderate.isPending}
        onConfirm={(reason) =>
          moderate.mutate(
            {
              ids: rejecting.map((testimonial) => testimonial.id),
              status: 'REJECTED',
              ...(reason && { rejectionReason: reason }),
            },
            {
              onSuccess: () => {
                setIsRejectOpen(false);
                onModerated?.();
              },
            },
          )
        }
      />

      <PhotoRequestDialog
        open={isAnswerOpen}
        testimonial={answering}
        onClose={() => setIsAnswerOpen(false)}
        isPending={answer.isPending}
        onAnswer={(payload) => {
          if (!answering) return;
          answer.mutate(
            { id: answering.id, payload },
            { onSuccess: () => setIsAnswerOpen(false) },
          );
        }}
        onOpenPhoto={(index) =>
          answering && setPreview({ testimonial: answering, index })
        }
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete testimonial"
        variant="destructive"
        confirmLabel="Delete"
        isPending={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(toDeleteTestimonialVariables(deleting), {
            onSuccess: () => setIsDeleteOpen(false),
          });
        }}
        description={
          <p>
            This removes the testimonial by{' '}
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {getDisplayName(deleting?.user)}
            </span>{' '}
            and its photos permanently. To take it off the storefront but keep
            it, reject it instead.
          </p>
        }
      />

      <PhotoPreviewDialog
        photos={preview?.testimonial.images ?? []}
        index={preview?.index ?? null}
        onIndexChange={(index) =>
          setPreview((current) =>
            current && index !== null ? { ...current, index } : null,
          )
        }
        title={
          preview
            ? `${getDisplayName(preview.testimonial.user)}'s photos`
            : 'Photos'
        }
      />
    </>
  );

  return {
    actions,
    approve,
    reject,
    dialogs,
    isBusy:
      moderate.isPending ||
      feature.isPending ||
      answer.isPending ||
      remove.isPending,
  };
};
