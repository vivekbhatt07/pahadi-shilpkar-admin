import { useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import RatingStars from '@/components/custom/RatingStars';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { formatDateTime, getDisplayName, getInitials } from '@/helpers/format';
import { useDeleteTestimonial, useTestimonials } from '@/hooks/testimonials';
import type { Combo, Product, Testimonial } from '@/types/api';

type TListingTestimonialsProps = {
  type: 'product' | 'combo';
  listing: Pick<
    Product | Combo,
    'id' | 'slug' | 'avgRating' | 'testimonialCount'
  >;
};

/**
 * The testimonials on one product or one combo — a combo's are its own, never
 * its products'. Moderation is delete-only: admins cannot edit another user's
 * testimonial (PATCH is author-only and answers 403).
 */
const ListingTestimonials = ({ type, listing }: TListingTestimonialsProps) => {
  const isProduct = type === 'product';
  const testimonials = useTestimonials(
    isProduct ? { productId: listing.id } : { comboId: listing.id },
  );
  const deleteTestimonial = useDeleteTestimonial();
  const [target, setTarget] = useState<Testimonial | null>(null);

  const items = testimonials.data ?? [];

  const handleDelete = () => {
    if (!target) return;
    deleteTestimonial.mutate(
      isProduct
        ? { id: target.id, productSlug: listing.slug }
        : { id: target.id, comboSlug: listing.slug },
      { onSuccess: () => setTarget(null) },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm font-semibold">
            Testimonials
            <Badge
              variant="secondary"
              className="ml-2 align-middle tabular-nums"
            >
              {listing.testimonialCount}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <RatingStars rating={listing.avgRating} />
            <span className="tabular-nums">
              {listing.avgRating.toFixed(1)} average
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {testimonials.isPending ? (
          <ListSkeleton rows={3} media="circle" trailing={0} bordered={false} />
        ) : items.length > 0 ? (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {items.map((testimonial) => (
              <li
                key={testimonial.id}
                className="group flex gap-3 px-3 py-4 transition-colors hover:bg-stone-50/60 sm:px-4 md:px-6 dark:hover:bg-stone-800/20"
              >
                <Avatar className="size-9 shrink-0 border border-stone-200 dark:border-stone-800">
                  <AvatarImage
                    src={testimonial.user.avatar || undefined}
                    alt={getDisplayName(testimonial.user)}
                  />
                  <AvatarFallback className="bg-stone-100 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {getInitials(testimonial.user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                      {getDisplayName(testimonial.user)}
                    </p>
                    <RatingStars rating={testimonial.rating} size={12} />
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {formatDateTime(testimonial.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-stone-700 dark:text-stone-300">
                    {testimonial.content}
                  </p>
                </div>
                <SimpleTooltip label="Delete testimonial">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setTarget(testimonial)}
                    aria-label="Delete testimonial"
                    className="shrink-0 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                  >
                    <Trash2 />
                  </Button>
                </SimpleTooltip>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title="No testimonials yet"
            description={`Customer testimonials for this ${type} will appear here.`}
            className="py-10"
          />
        )}
      </CardContent>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Delete testimonial"
        variant="destructive"
        confirmLabel="Delete"
        isPending={deleteTestimonial.isPending}
        onConfirm={handleDelete}
        description={
          <p>
            This removes the testimonial by{' '}
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {getDisplayName(target?.user)}
            </span>{' '}
            permanently. This cannot be undone.
          </p>
        }
      />
    </Card>
  );
};

export default ListingTestimonials;
