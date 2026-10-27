import { useState } from 'react';
import { Gauge, ImageOff, Loader2, Trash2 } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes, formatDate } from '@/helpers/format';
import {
  useDeleteUnusedImages,
  useStorageUsage,
  useUnusedImages,
} from '@/hooks/storage';
import { cn } from '@/lib/utils';
import type { StorageUsage, UnusedImages } from '@/types/api';

import SettingsSection from '../components/SettingsSection';
import {
  describeMeter,
  formatCredits,
  usageTone,
  type TUsageTone,
} from './helpers';

/** Unused photos shown at a time — each is a thumbnail to load. */
const PAGE_SIZE = 48;

const BAR_TONE: Record<TUsageTone, string> = {
  normal: 'bg-accent-500 dark:bg-accent-400',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const UsageBar = ({ percent, label }: { percent: number; label: string }) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(percent)}
    className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
  >
    <div
      className={cn(
        'h-full rounded-full transition-[width] duration-500',
        BAR_TONE[usageTone(percent)],
      )}
      style={{ width: `${Math.min(100, Math.max(percent, 1))}%` }}
    />
  </div>
);

const METERS = [
  {
    key: 'transformations',
    label: 'Transformations',
    hint: 'Each new size of a photo, made once and kept',
    unit: 'count',
  },
  {
    key: 'storage',
    label: 'Storage',
    hint: 'Photos and their resized copies',
    unit: 'bytes',
  },
  {
    key: 'bandwidth',
    label: 'Bandwidth',
    hint: 'Photos sent to shoppers — and to this panel',
    unit: 'bytes',
  },
] as const;

const Usage = ({ usage }: { usage: StorageUsage }) => (
  <>
    {usage.credits && (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            <span className="text-2xl font-semibold text-stone-900 tabular-nums dark:text-stone-50">
              {formatCredits(usage.credits.used)}
            </span>{' '}
            of {formatCredits(usage.credits.limit)} credits
          </p>
          <span className="text-sm font-medium text-stone-700 tabular-nums dark:text-stone-200">
            {Math.round(usage.credits.usedPercent)}%
          </span>
        </div>
        <UsageBar percent={usage.credits.usedPercent} label="Credits used" />
      </div>
    )}

    <dl className="flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
      {METERS.map(({ key, label, hint, unit }) => {
        const meter = usage[key];
        return (
          <div key={key} className="flex flex-col gap-2 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <dt className="min-w-0">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {label}
                </p>
                <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                  {hint}
                </p>
              </dt>
              <dd className="shrink-0 text-right text-sm text-stone-700 tabular-nums dark:text-stone-200">
                {describeMeter(meter, unit)}
              </dd>
            </div>
            {!usage.credits && meter.usedPercent !== null && (
              <UsageBar percent={meter.usedPercent} label={`${label} used`} />
            )}
          </div>
        );
      })}
    </dl>

    <p className="text-xs text-stone-500 dark:text-stone-400">
      {usage.credits &&
        'A credit is 1,000 transformations, 1 GB stored or 1 GB sent. '}
      {usage.countedOn
        ? `Cloudinary counts about once a day — last on ${formatDate(usage.countedOn)}.`
        : 'Cloudinary counts about once a day.'}
    </p>
  </>
);

const UnusedPhotos = ({ data }: { data: UnusedImages }) => {
  const remove = useDeleteUnusedImages();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [shown, setShown] = useState(PAGE_SIZE);
  const [confirming, setConfirming] = useState(false);
  const { items, totalBytes } = data;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ImageOff className="size-5" />}
        title="No unused photos"
        description="Every photo uploaded is in use on the store."
        className="py-8"
      />
    );
  }

  // Only those still listed — a refetch after a delete drops the rest
  const picked = items.filter((item) => selected.has(item.publicId));
  const pickedBytes = picked.reduce((sum, item) => sum + item.bytes, 0);
  const allPicked = picked.length === items.length;

  const toggle = (publicId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(publicId)) next.add(publicId);
      return next;
    });

  const deletePicked = () =>
    remove.mutate(
      picked.map((item) => item.publicId),
      {
        onSuccess: () => {
          setSelected(new Set());
          setConfirming(false);
        },
      },
    );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700 dark:text-stone-200">
          <Checkbox
            checked={
              allPicked ? true : picked.length > 0 ? 'indeterminate' : false
            }
            onCheckedChange={() =>
              setSelected(
                allPicked
                  ? new Set()
                  : new Set(items.map((item) => item.publicId)),
              )
            }
          />
          <span className="tabular-nums">
            {picked.length > 0
              ? `${picked.length} of ${items.length} selected · ${formatBytes(pickedBytes)}`
              : `Select all ${items.length} · ${formatBytes(totalBytes)}`}
          </span>
        </label>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={picked.length === 0 || remove.isPending}
          onClick={() => setConfirming(true)}
          startAdornment={
            remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />
          }
        >
          Delete
        </Button>
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {items.slice(0, shown).map((item) => {
          const isPicked = selected.has(item.publicId);
          return (
            <li key={item.publicId}>
              <label className="flex cursor-pointer flex-col gap-1.5">
                <span className="relative block">
                  <ImageThumb
                    src={item.url}
                    alt=""
                    rounded="lg"
                    className={cn(
                      'aspect-square w-full transition-shadow',
                      isPicked &&
                        'ring-2 ring-accent-500 ring-offset-2 ring-offset-white dark:ring-accent-400 dark:ring-offset-stone-900',
                    )}
                  />
                  <Checkbox
                    checked={isPicked}
                    onCheckedChange={() => toggle(item.publicId)}
                    aria-label={`Photo uploaded ${formatDate(item.uploadedAt)}`}
                    className="absolute top-1.5 left-1.5"
                  />
                </span>
                <span className="truncate text-[11px] text-stone-500 tabular-nums dark:text-stone-400">
                  {formatBytes(item.bytes)} · {formatDate(item.uploadedAt)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {shown < items.length && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => setShown((count) => count + PAGE_SIZE)}
        >
          Show more ({items.length - shown} left)
        </Button>
      )}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        variant="destructive"
        title={`Delete ${picked.length} unused ${picked.length === 1 ? 'photo' : 'photos'}?`}
        confirmLabel="Delete"
        isPending={remove.isPending}
        onConfirm={deletePicked}
        description={
          <p>
            {picked.length === 1 ? "It's" : "They're"} removed from Cloudinary
            for good, freeing {formatBytes(pickedBytes)}. One saved on a
            product, banner or anything else since this list was loaded is kept.
          </p>
        }
      />
    </>
  );
};

/** The store's Cloudinary account: this month's usage, and photos to clear. */
const PhotoStoragePage = () => {
  const usage = useStorageUsage();
  const unused = useUnusedImages();
  const minAgeDays = unused.data?.minAgeDays ?? 2;

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        icon={<Gauge />}
        title="This month on Cloudinary"
        description={
          usage.data?.plan
            ? `Where product photos live — the ${usage.data.plan} plan.`
            : 'Where product photos live.'
        }
      >
        {usage.isPending ? (
          <div
            className="flex flex-col gap-3"
            role="status"
            aria-label="Loading"
          >
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ) : usage.isError ? (
          <Callout variant="warning" size="md" title="Usage isn't available">
            {usage.error.message}
          </Callout>
        ) : (
          <Usage usage={usage.data} />
        )}
      </SettingsSection>

      <SettingsSection
        icon={<ImageOff />}
        title="Unused photos"
        description={`Uploaded in a form that was never saved, so nothing on the store shows them — unused for at least ${minAgeDays} days. A photo in use is never deleted.`}
      >
        {unused.isPending ? (
          <div
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6"
            role="status"
            aria-label="Loading"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : unused.isError ? (
          <Callout variant="warning" size="md" title="Couldn't list them">
            {unused.error.message}
          </Callout>
        ) : (
          <UnusedPhotos data={unused.data} />
        )}
      </SettingsSection>
    </div>
  );
};

export default PhotoStoragePage;
