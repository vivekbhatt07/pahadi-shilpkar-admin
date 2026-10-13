import { Link } from 'react-router';
import { MessageSquare } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import RatingStars from '@/components/custom/RatingStars';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatDateTime, getDisplayName, getInitials } from '@/helpers/format';
import { useAllTestimonials } from '@/hooks/testimonials';
import type { Combo, Product } from '@/types/api';

import { useTestimonialModeration } from '../useTestimonialModeration';
import {
  TestimonialBody,
  TestimonialRowActions,
  TestimonialStatusBadges,
} from './TestimonialsTable';

type TListingTestimonialsProps = {
  type: 'product' | 'combo';
  listing: Pick<
    Product | Combo,
    'id' | 'slug' | 'avgRating' | 'testimonialCount'
  >;
};

/** One listing rarely has more; the queue pages through the rest. */
const LISTING_LIMIT = 100;

/**
 * The testimonials on one product or one combo, in every status — a combo's
 * are its own, never its products'. Moderated right here, as in the queue;
 * admins cannot edit another user's words (PATCH is author-only).
 */
const ListingTestimonials = ({ type, listing }: TListingTestimonialsProps) => {
  const testimonials = useAllTestimonials(
    type === 'product'
      ? { productId: listing.id, limit: LISTING_LIMIT }
      : { comboId: listing.id, limit: LISTING_LIMIT },
  );
  const moderation = useTestimonialModeration();

  const items = testimonials.data?.items ?? [];
  const pendingCount = items.filter((t) => t.status === 'PENDING').length;

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
            {pendingCount > 0 && (
              <Badge variant="warning" className="ml-1.5 align-middle">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <RatingStars rating={listing.avgRating} />
            <span className="tabular-nums">
              {listing.avgRating.toFixed(1)} average of the approved ones
            </span>
          </div>
        </div>
        {pendingCount > 0 && (
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.PRIVATE.TESTIMONIALS}>Open the queue</Link>
          </Button>
        )}
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
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                      {getDisplayName(testimonial.user)}
                    </p>
                    <RatingStars rating={testimonial.rating} size={12} />
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {formatDateTime(testimonial.createdAt)}
                    </span>
                    <TestimonialStatusBadges testimonial={testimonial} />
                  </div>
                  <TestimonialBody
                    testimonial={testimonial}
                    clamp={false}
                    onOpenPhoto={(index) =>
                      moderation.actions.onOpenPhoto(testimonial, index)
                    }
                  />
                </div>
                <TestimonialRowActions
                  testimonial={testimonial}
                  isBusy={moderation.isBusy}
                  {...moderation.actions}
                />
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

      {moderation.dialogs}
    </Card>
  );
};

export default ListingTestimonials;
