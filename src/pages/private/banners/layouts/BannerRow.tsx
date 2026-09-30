import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CalendarClock,
  GripVertical,
  Link2,
  Pencil,
  Smartphone,
  Trash2,
} from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useUpdateBanner } from '@/hooks/banners';
import { cn } from '@/lib/utils';
import type { Banner } from '@/types/api';

import { BANNER_STATUS_BADGES } from '../constants';
import type { TBannerStatus } from '../types';

type TBannerRowProps = {
  banner: Banner;
  status: TBannerStatus;
  /** What the schedule means for the banner right now, if it has one. */
  schedule: string | null;
  canReorder: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const BannerRow = ({
  banner,
  status,
  schedule,
  canReorder,
  onEdit,
  onDelete,
}: TBannerRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id, disabled: !canReorder });
  const updateBanner = useUpdateBanner();
  const badge = BANNER_STATUS_BADGES[status];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-3 border-b border-stone-100 bg-white py-3 pr-3 pl-2 transition-colors last:border-b-0 sm:pr-4 dark:border-stone-800 dark:bg-stone-900',
        'hover:bg-stone-50/80 dark:hover:bg-stone-800/30',
        isDragging &&
          'relative z-10 rounded-lg border-transparent shadow-xl ring-2 ring-accent-500/40 dark:bg-stone-800',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={!canReorder}
        aria-label={`Reorder ${banner.title}`}
        className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-0.5 text-stone-300 transition-colors group-hover:text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:outline-none active:cursor-grabbing disabled:cursor-default disabled:opacity-40 dark:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Too small to recognise on a phone — the title does the job there */}
      <ImageThumb
        src={banner.image}
        alt={banner.title}
        className={cn(
          'hidden aspect-3/1 w-36 transition-opacity sm:flex',
          status !== 'live' && 'opacity-60',
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={onEdit}
            className="min-w-0 cursor-pointer truncate text-left text-sm font-medium text-stone-900 transition-colors hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
          >
            {banner.title}
          </button>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        {banner.subtitle && (
          <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
            {banner.subtitle}
          </p>
        )}
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400 [&_svg]:size-3.5 [&_svg]:shrink-0">
          {schedule && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock />
              {schedule}
            </span>
          )}
          {banner.ctaUrl && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Link2 />
              <span className="truncate">
                {banner.ctaLabel && (
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {banner.ctaLabel} →{' '}
                  </span>
                )}
                {banner.ctaUrl}
              </span>
            </span>
          )}
          {banner.mobileImage && (
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Smartphone />
              Phone image
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <SimpleTooltip
          label={
            banner.isActive
              ? 'On — shown within its schedule'
              : 'Off — hidden from the storefront'
          }
        >
          <span className="mr-1.5 inline-flex">
            <Switch
              checked={banner.isActive}
              onCheckedChange={(checked) =>
                updateBanner.mutate({
                  id: banner.id,
                  payload: { isActive: checked },
                })
              }
              disabled={updateBanner.isPending}
              aria-label={
                banner.isActive
                  ? `Hide ${banner.title}`
                  : `Show ${banner.title}`
              }
            />
          </span>
        </SimpleTooltip>
        <SimpleTooltip label="Edit">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${banner.title}`}
          >
            <Pencil className="text-stone-400" />
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label="Delete">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label={`Delete ${banner.title}`}
            className="text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
          >
            <Trash2 />
          </Button>
        </SimpleTooltip>
      </div>
    </li>
  );
};

export default BannerRow;
