import { Link } from 'react-router';
import { Check, ImageUp, Pin, PinOff, Trash2, X } from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import RatingStars from '@/components/custom/RatingStars';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { formatDateTime, getDisplayName, getInitials } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { TestimonialWithListing } from '@/types/api';

import { PHOTO_REQUEST_LABELS, TESTIMONIAL_STATUS_BADGES } from '../constants';
import { getTestimonialListing, hasPendingPhotoRequest } from '../helpers';

export type TTestimonialActions = {
  onApprove: (testimonial: TestimonialWithListing) => void;
  onReject: (testimonial: TestimonialWithListing) => void;
  onToggleFeatured: (testimonial: TestimonialWithListing) => void;
  onAnswerPhotoRequest: (testimonial: TestimonialWithListing) => void;
  onDelete: (testimonial: TestimonialWithListing) => void;
  onOpenPhoto: (testimonial: TestimonialWithListing, index: number) => void;
};

type TTestimonialsTableProps = TTestimonialActions & {
  testimonials: TestimonialWithListing[];
  selectedIds: ReadonlySet<string>;
  onToggleSelected: (
    testimonial: TestimonialWithListing,
    selected: boolean,
  ) => void;
  onToggleAll: (selected: boolean) => void;
  isBusy?: boolean;
};

/** A thumbnail, a Product / Combo label, then a link to whichever was reviewed. */
const ListingCell = ({
  testimonial,
}: {
  testimonial: TestimonialWithListing;
}) => {
  const listing = getTestimonialListing(testimonial);
  if (!listing) return <span className="text-sm text-stone-400">—</span>;

  return (
    <Link to={listing.to} className="group flex min-w-0 items-center gap-2.5">
      <ImageThumb src={listing.image} alt="" className="size-9" />
      <div className="min-w-0">
        <Badge variant={listing.kind === 'Combo' ? 'accent' : 'outline'}>
          {listing.kind}
        </Badge>
        <p className="mt-0.5 truncate text-sm text-stone-700 transition-colors group-hover:text-accent-600 dark:text-stone-300 dark:group-hover:text-accent-400">
          {listing.name}
        </p>
      </div>
    </Link>
  );
};

/** The words, the photos, and anything the author or an admin added. */
export const TestimonialBody = ({
  testimonial,
  onOpenPhoto,
  clamp = true,
}: {
  testimonial: TestimonialWithListing;
  onOpenPhoto: (index: number) => void;
  clamp?: boolean;
}) => (
  <div className="flex min-w-0 flex-col gap-2">
    {testimonial.variant && (
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Bought:{' '}
        <span className="font-medium text-stone-700 dark:text-stone-300">
          {testimonial.variant.title}
        </span>
      </p>
    )}
    <p
      className={cn(
        'max-w-xl text-sm leading-relaxed whitespace-pre-line text-stone-700 dark:text-stone-300',
        clamp && 'line-clamp-3',
      )}
    >
      {testimonial.content}
    </p>
    {testimonial.images.length > 0 && (
      <ul className="flex flex-wrap gap-1.5">
        {testimonial.images.map((src, index) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => onOpenPhoto(index)}
              aria-label={`See photo ${index + 1} by ${getDisplayName(testimonial.user)}`}
              className="block cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
            >
              <ImageThumb src={src} alt="" className="size-12" />
            </button>
          </li>
        ))}
      </ul>
    )}
    {testimonial.status === 'REJECTED' && testimonial.rejectionReason && (
      <p className="text-xs text-red-600 dark:text-red-400">
        Reason: {testimonial.rejectionReason}
      </p>
    )}
    {testimonial.photoRequest && (
      <p
        className={cn(
          'flex items-center gap-1.5 text-xs',
          hasPendingPhotoRequest(testimonial)
            ? 'font-medium text-amber-700 dark:text-amber-400'
            : 'text-stone-500 dark:text-stone-400',
        )}
      >
        <ImageUp className="size-3.5 shrink-0" />
        {PHOTO_REQUEST_LABELS[testimonial.photoRequest.status]}
        {hasPendingPhotoRequest(testimonial) &&
          testimonial.photoRequest.reason &&
          `: “${testimonial.photoRequest.reason}”`}
      </p>
    )}
  </div>
);

/** Status badge, plus a pin when it's on the storefront's slider. */
export const TestimonialStatusBadges = ({
  testimonial,
}: {
  testimonial: TestimonialWithListing;
}) => {
  const badge = TESTIMONIAL_STATUS_BADGES[testimonial.status];
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={badge.variant}>{badge.label}</Badge>
      {testimonial.isFeatured && (
        <Badge variant="accent" className="gap-1">
          <Pin />
          Pinned
        </Badge>
      )}
    </div>
  );
};

/** What can be done with a testimonial in its current status. */
export const TestimonialRowActions = ({
  testimonial,
  isBusy,
  onApprove,
  onReject,
  onToggleFeatured,
  onAnswerPhotoRequest,
  onDelete,
}: Omit<TTestimonialActions, 'onOpenPhoto'> & {
  testimonial: TestimonialWithListing;
  isBusy?: boolean;
}) => {
  const author = getDisplayName(testimonial.user);
  const isApproved = testimonial.status === 'APPROVED';

  return (
    <div className="flex items-center justify-end gap-0.5">
      {hasPendingPhotoRequest(testimonial) && (
        <SimpleTooltip label="Answer photo request">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onAnswerPhotoRequest(testimonial)}
            disabled={isBusy}
            aria-label={`Answer ${author}'s photo request`}
            className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
          >
            <ImageUp />
          </Button>
        </SimpleTooltip>
      )}
      {!isApproved && (
        <SimpleTooltip label="Approve">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onApprove(testimonial)}
            disabled={isBusy}
            aria-label={`Approve testimonial by ${author}`}
            className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <Check />
          </Button>
        </SimpleTooltip>
      )}
      {isApproved && (
        <SimpleTooltip
          label={testimonial.isFeatured ? 'Unpin from slider' : 'Pin to slider'}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggleFeatured(testimonial)}
            disabled={isBusy}
            aria-label={
              testimonial.isFeatured
                ? `Unpin testimonial by ${author}`
                : `Pin testimonial by ${author} to the storefront slider`
            }
            className={cn(
              testimonial.isFeatured
                ? 'text-accent-600 dark:text-accent-400'
                : 'text-stone-400',
            )}
          >
            {testimonial.isFeatured ? <PinOff /> : <Pin />}
          </Button>
        </SimpleTooltip>
      )}
      {testimonial.status !== 'REJECTED' && (
        <SimpleTooltip label={isApproved ? 'Take down' : 'Reject'}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onReject(testimonial)}
            disabled={isBusy}
            aria-label={`Reject testimonial by ${author}`}
            className="text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
          >
            <X />
          </Button>
        </SimpleTooltip>
      )}
      <SimpleTooltip label="Delete">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(testimonial)}
          disabled={isBusy}
          aria-label={`Delete testimonial by ${author}`}
          className="text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
        >
          <Trash2 />
        </Button>
      </SimpleTooltip>
    </div>
  );
};

const TestimonialsTable = ({
  testimonials,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  isBusy,
  onOpenPhoto,
  ...actions
}: TTestimonialsTableProps) => {
  const selectedCount = testimonials.filter((testimonial) =>
    selectedIds.has(testimonial.id),
  ).length;
  const allSelected =
    testimonials.length > 0 && selectedCount === testimonials.length;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
      <Table>
        <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
          <TableRow>
            <TableHead className="w-10 pr-0">
              <Checkbox
                checked={
                  allSelected
                    ? true
                    : selectedCount > 0
                      ? 'indeterminate'
                      : false
                }
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label={
                  allSelected
                    ? 'Deselect every testimonial on this page'
                    : 'Select every testimonial on this page'
                }
              />
            </TableHead>
            <TableHead className="min-w-44">Author</TableHead>
            <TableHead className="hidden min-w-48 lg:table-cell">
              Reviewed
            </TableHead>
            <TableHead className="min-w-72">Testimonial</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="hidden w-32 xl:table-cell">Posted</TableHead>
            <TableHead className="w-40 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testimonials.map((testimonial) => (
            <TableRow
              key={testimonial.id}
              data-state={
                selectedIds.has(testimonial.id) ? 'selected' : undefined
              }
              className="align-top"
            >
              <TableCell className="pr-0">
                <Checkbox
                  checked={selectedIds.has(testimonial.id)}
                  onCheckedChange={(checked) =>
                    onToggleSelected(testimonial, checked === true)
                  }
                  aria-label={`Select testimonial by ${getDisplayName(testimonial.user)}`}
                />
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8 shrink-0 border border-stone-200 dark:border-stone-800">
                    <AvatarImage
                      src={testimonial.user.avatar || undefined}
                      alt={getDisplayName(testimonial.user)}
                    />
                    <AvatarFallback className="bg-stone-100 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {getInitials(testimonial.user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                      {getDisplayName(testimonial.user)}
                    </p>
                    <RatingStars rating={testimonial.rating} size={12} />
                  </div>
                </div>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <ListingCell testimonial={testimonial} />
              </TableCell>

              <TableCell>
                <TestimonialBody
                  testimonial={testimonial}
                  onOpenPhoto={(index) => onOpenPhoto(testimonial, index)}
                />
              </TableCell>

              <TableCell>
                <TestimonialStatusBadges testimonial={testimonial} />
              </TableCell>

              <TableCell className="hidden text-xs whitespace-nowrap text-stone-500 xl:table-cell dark:text-stone-400">
                {formatDateTime(testimonial.createdAt)}
              </TableCell>

              <TableCell className="text-right">
                <TestimonialRowActions
                  testimonial={testimonial}
                  isBusy={isBusy}
                  {...actions}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TestimonialsTable;
