import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Camera,
  Check,
  CheckCheck,
  ImageUp,
  MessageSquare,
  X,
} from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import { Button } from '@/components/ui/button';
import { useAllTestimonials } from '@/hooks/testimonials';
import { useStats } from '@/hooks/stats';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { TestimonialWithListing } from '@/types/api';

import {
  DEFAULT_TESTIMONIAL_TAB,
  TESTIMONIAL_LIST_LIMIT,
  TESTIMONIAL_LIST_SEARCH_PARAMS,
  TESTIMONIAL_TABS,
  type TTestimonialTab,
} from './constants';
import { isTestimonialTab } from './helpers';
import TestimonialsTable from './layouts/TestimonialsTable';
import { useTestimonialModeration } from './useTestimonialModeration';

const { TAB, PHOTOS, PAGE } = TESTIMONIAL_LIST_SEARCH_PARAMS;

/** Never mutated — the "nothing selected" value. */
const NO_SELECTION: ReadonlySet<string> = new Set();

const EMPTY_STATES: Record<
  TTestimonialTab,
  { icon: React.ReactNode; title: string; description: string }
> = {
  pending: {
    icon: <CheckCheck className="size-5" />,
    title: "You're all caught up",
    description:
      'New testimonials wait here for your approval before shoppers see them — and so do ones their authors have edited.',
  },
  approved: {
    icon: <MessageSquare className="size-5" />,
    title: 'No approved testimonials yet',
    description:
      'Approved testimonials appear on their product or combo, in the storefront slider and on the reviews page.',
  },
  rejected: {
    icon: <MessageSquare className="size-5" />,
    title: 'Nothing rejected',
    description:
      'Testimonials you turn down show here — their authors see your reason and can edit them.',
  },
  all: {
    icon: <MessageSquare className="size-5" />,
    title: 'No testimonials yet',
    description: 'Customer testimonials will appear here once submitted.',
  },
  'photo-requests': {
    icon: <ImageUp className="size-5" />,
    title: 'No photo requests',
    description:
      'Photos can be added to a testimonial once. When an author asks to change theirs, the request waits here.',
  },
};

const TabFilter = ({
  value,
  counts,
  onChange,
}: {
  value: TTestimonialTab;
  /** Shown on the tabs that are a to-do list, once known. */
  counts: Partial<Record<TTestimonialTab, number>>;
  onChange: (value: TTestimonialTab) => void;
}) => (
  <div
    role="group"
    aria-label="Show"
    className="flex w-fit max-w-full overflow-x-auto rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
  >
    {TESTIMONIAL_TABS.map((tab) => {
      const count = counts[tab.value];
      return (
        <button
          key={tab.value}
          type="button"
          aria-pressed={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30',
            value === tab.value
              ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-stone-50'
              : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50',
          )}
        >
          {tab.label}
          {Boolean(count) && (
            <span className="rounded-full bg-accent-600 px-1.5 text-[11px] leading-4.5 font-semibold text-white tabular-nums dark:bg-accent-500">
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const TestimonialsPage = () => {
  useDocumentTitle('Testimonials');
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get(TAB);
  const tab = isTestimonialTab(tabParam) ? tabParam : DEFAULT_TESTIMONIAL_TAB;
  const withPhotos = searchParams.get(PHOTOS) === '1';
  const page = Math.max(1, Number(searchParams.get(PAGE)) || 1);
  const tabParams =
    TESTIMONIAL_TABS.find((option) => option.value === tab)?.params ?? {};

  const testimonials = useAllTestimonials({
    ...tabParams,
    ...(withPhotos && { withPhotos }),
    page,
    limit: TESTIMONIAL_LIST_LIMIT,
  });
  const stats = useStats();
  const items = testimonials.data?.items ?? [];

  // A selection belongs to one view of the list (tab + filter + page), so
  // any navigation starts from nothing selected without an effect to reset it.
  const listKey = searchParams.toString();
  const [selection, setSelection] = useState<{
    key: string;
    ids: ReadonlySet<string>;
  }>({ key: listKey, ids: NO_SELECTION });
  const selectedIds = selection.key === listKey ? selection.ids : NO_SELECTION;
  const setSelectedIds = (ids: ReadonlySet<string>) =>
    setSelection({ key: listKey, ids });
  // Rows can drop out of the page after a refetch; only act on visible ones.
  const selected = items.filter((testimonial) =>
    selectedIds.has(testimonial.id),
  );

  const moderation = useTestimonialModeration({
    onModerated: () => setSelectedIds(NO_SELECTION),
  });

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  // Approving the last rows of a later page empties it — step back instead
  useEffect(() => {
    if (testimonials.isSuccess && items.length === 0 && page > 1) {
      const next = new URLSearchParams(searchParams);
      if (page > 2) next.set(PAGE, String(page - 1));
      else next.delete(PAGE);
      setSearchParams(next, { replace: true });
    }
  }, [
    testimonials.isSuccess,
    items.length,
    page,
    searchParams,
    setSearchParams,
  ]);

  const toggleSelected = (
    testimonial: TestimonialWithListing,
    isSelected: boolean,
  ) => {
    const next = new Set(selectedIds);
    if (isSelected) next.add(testimonial.id);
    else next.delete(testimonial.id);
    setSelectedIds(next);
  };

  const empty = EMPTY_STATES[tab];
  const counts = stats.data?.testimonials;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Testimonials"
        count={counts?.total}
        description="Every new testimonial waits here for your approval — only approved ones reach the storefront, and an author's edit sends one back for another look."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabFilter
          value={tab}
          counts={{
            pending: counts?.pending,
            'photo-requests': counts?.photoRequests,
          }}
          onChange={(next) =>
            updateParams({
              [TAB]: next === DEFAULT_TESTIMONIAL_TAB ? undefined : next,
              [PAGE]: undefined,
            })
          }
        />
        <Button
          variant={withPhotos ? 'default' : 'outline'}
          size="sm"
          aria-pressed={withPhotos}
          onClick={() =>
            updateParams({
              [PHOTOS]: withPhotos ? undefined : '1',
              [PAGE]: undefined,
            })
          }
          className="w-fit"
        >
          <Camera />
          With photos
        </Button>
      </div>

      {selected.length > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="flex animate-in flex-wrap items-center gap-2 rounded-xl border border-accent-200 bg-accent-50/70 px-3 py-2 duration-150 fade-in-0 slide-in-from-top-1 dark:border-accent-900/60 dark:bg-accent-950/30"
        >
          <span className="mr-1 text-sm font-medium text-accent-900 tabular-nums dark:text-accent-100">
            {selected.length} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={moderation.isBusy}
            onClick={() => moderation.approve(selected)}
          >
            <Check />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={moderation.isBusy}
            onClick={() => moderation.reject(selected)}
          >
            <X />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(NO_SELECTION)}
            disabled={moderation.isBusy}
            className="ml-auto"
          >
            Clear
          </Button>
        </div>
      )}

      {testimonials.isPending ? (
        <ListSkeleton rows={8} media="circle" trailing={2} />
      ) : items.length > 0 ? (
        <div
          aria-busy={testimonials.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            testimonials.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <TestimonialsTable
            testimonials={items}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            onToggleAll={(isSelected) =>
              setSelectedIds(
                isSelected
                  ? new Set(items.map((testimonial) => testimonial.id))
                  : NO_SELECTION,
              )
            }
            isBusy={moderation.isBusy}
            {...moderation.actions}
          />
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
      ) : withPhotos ? (
        <EmptyState
          icon={<Camera className="size-5" />}
          title="None with photos here"
          description="No testimonial in this list has photos."
          action={
            <Button
              variant="outline"
              onClick={() => updateParams({ [PHOTOS]: undefined })}
            >
              Show all
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
        />
      )}

      {moderation.dialogs}
    </div>
  );
};

export default TestimonialsPage;
