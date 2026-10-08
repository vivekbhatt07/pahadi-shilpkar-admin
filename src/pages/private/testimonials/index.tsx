import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { MessageSquare } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { getDisplayName } from '@/helpers/format';
import { useAllTestimonials, useDeleteTestimonial } from '@/hooks/testimonials';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { TestimonialWithListing } from '@/types/api';

import {
  TESTIMONIAL_LIST_LIMIT,
  TESTIMONIAL_LIST_SEARCH_PARAMS,
} from './constants';
import { toDeleteTestimonialVariables } from './helpers';
import TestimonialsTable from './layouts/TestimonialsTable';

const { PAGE } = TESTIMONIAL_LIST_SEARCH_PARAMS;

const TestimonialsPage = () => {
  useDocumentTitle('Testimonials');
  const [searchParams, setSearchParams] = useSearchParams();
  const [target, setTarget] = useState<TestimonialWithListing | null>(null);

  const page = Math.max(1, Number(searchParams.get(PAGE)) || 1);

  const testimonials = useAllTestimonials({
    page,
    limit: TESTIMONIAL_LIST_LIMIT,
  });
  const deleteTestimonial = useDeleteTestimonial();

  const items = testimonials.data?.items ?? [];

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const closeDialog = () => setTarget(null);

  const handleDelete = () => {
    if (!target) return;
    deleteTestimonial.mutate(toDeleteTestimonialVariables(target), {
      onSuccess: closeDialog,
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Testimonials"
        count={testimonials.data?.total}
        description="Customer testimonials across all products and combos. Deleting one cannot be undone."
      />

      {testimonials.isPending ? (
        <ListSkeleton rows={8} media="circle" trailing={1} />
      ) : items.length > 0 ? (
        <div
          aria-busy={testimonials.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            testimonials.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <TestimonialsTable testimonials={items} onDelete={setTarget} />
          <TablePagination
            page={testimonials.data?.page ?? page}
            limit={testimonials.data?.limit ?? TESTIMONIAL_LIST_LIMIT}
            total={testimonials.data?.total ?? 0}
            hasMore={testimonials.data?.hasMore ?? false}
            isFetching={testimonials.isFetching}
            onPageChange={(next) =>
              updateParams({ [PAGE]: next > 1 ? String(next) : undefined })
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquare className="size-5" />}
          title="No testimonials yet"
          description="Customer testimonials will appear here once submitted."
        />
      )}

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && closeDialog()}
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
    </div>
  );
};

export default TestimonialsPage;
