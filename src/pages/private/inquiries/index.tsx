import { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { Inbox } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { useDeleteInquiry, useInquiries } from '@/hooks/inquiries';
import { useSettings } from '@/hooks/settings';
import { useStats } from '@/hooks/stats';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { Inquiry, InquiryStatus } from '@/types/api';

import {
  INQUIRY_LIST_LIMIT,
  INQUIRY_LIST_SEARCH_PARAMS,
  INQUIRY_STATUS_BADGES,
  INQUIRY_STATUSES,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPES,
} from './constants';
import { isInquiryStatus, isInquiryType } from './helpers';
import InquiriesTable from './layouts/InquiriesTable';
import InquiryDialog from './layouts/InquiryDialog';

const { STATUS, TYPE, PAGE } = INQUIRY_LIST_SEARCH_PARAMS;

/** Radix Select can't hold an empty value. */
const ALL_TYPES = 'ALL';

const StatusFilter = ({
  value,
  newCount,
  onChange,
}: {
  value: InquiryStatus | undefined;
  /** Shown on the "New" option once known. */
  newCount: number | undefined;
  onChange: (value: InquiryStatus | undefined) => void;
}) => (
  <div
    role="group"
    aria-label="Status"
    className="flex w-fit max-w-full overflow-x-auto rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
  >
    {[undefined, ...INQUIRY_STATUSES].map((status) => (
      <button
        key={status ?? 'ALL'}
        type="button"
        aria-pressed={value === status}
        onClick={() => onChange(status)}
        className={cn(
          'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30',
          value === status
            ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-stone-50'
            : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50',
        )}
      >
        {status ? INQUIRY_STATUS_BADGES[status].label : 'All'}
        {status === 'NEW' && Boolean(newCount) && (
          <span className="rounded-full bg-accent-600 px-1.5 text-[11px] leading-4.5 font-semibold text-white tabular-nums dark:bg-accent-500">
            {newCount}
          </span>
        )}
      </button>
    ))}
  </div>
);

const InquiriesPage = () => {
  useDocumentTitle('Inquiries');
  const [searchParams, setSearchParams] = useSearchParams();
  // Kept after the dialog closes, so its content doesn't vanish mid-animation
  const [viewing, setViewing] = useState<Inquiry | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null);

  const statusParam = searchParams.get(STATUS);
  const status = isInquiryStatus(statusParam) ? statusParam : undefined;
  const typeParam = searchParams.get(TYPE);
  const type = isInquiryType(typeParam) ? typeParam : undefined;
  const page = Math.max(1, Number(searchParams.get(PAGE)) || 1);

  const inquiries = useInquiries({
    status,
    type,
    page,
    limit: INQUIRY_LIST_LIMIT,
  });
  const deleteInquiry = useDeleteInquiry();
  const stats = useStats();
  const settings = useSettings();

  const items = inquiries.data?.items ?? [];
  const isFiltered = Boolean(status || type);

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const openInquiry = (inquiry: Inquiry) => {
    setViewing(inquiry);
    setIsViewOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteInquiry.mutate(deleteTarget.id, {
      onSuccess: () => {
        // The last row of a later page — step back rather than land on an empty one
        if (items.length === 1 && page > 1) {
          updateParams({ [PAGE]: page > 2 ? String(page - 1) : undefined });
        }
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Inquiries"
        count={inquiries.data?.total}
        description="Messages from the storefront contact form — custom pieces, bulk and gifting orders, and questions. Reply by email, phone or WhatsApp."
      />

      {settings.data && !settings.data.contactEmail && (
        <Callout
          variant="info"
          title="New inquiries aren't emailed to anyone yet"
          action={
            <Button variant="outline" size="sm" asChild>
              <RouterLink to={ROUTES.PRIVATE.SETTINGS.STORE}>
                Add a contact email
              </RouterLink>
            </Button>
          }
        >
          With a contact email in Store settings, each inquiry arrives there
          too, and replying answers the shopper directly.
        </Callout>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilter
          value={status}
          newCount={stats.data?.inquiries.new}
          onChange={(next) =>
            updateParams({ [STATUS]: next, [PAGE]: undefined })
          }
        />
        <Select
          value={type ?? ALL_TYPES}
          onValueChange={(next) =>
            updateParams({
              [TYPE]: next === ALL_TYPES ? undefined : next,
              [PAGE]: undefined,
            })
          }
        >
          <SelectTrigger aria-label="Type" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES}>All types</SelectItem>
            {INQUIRY_TYPES.map((option) => (
              <SelectItem key={option} value={option}>
                {INQUIRY_TYPE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {inquiries.isPending ? (
        <ListSkeleton rows={6} media="none" trailing={1} />
      ) : items.length > 0 ? (
        <div
          aria-busy={inquiries.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            inquiries.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <InquiriesTable
            inquiries={items}
            onOpen={openInquiry}
            onDelete={setDeleteTarget}
          />
          <TablePagination
            page={inquiries.data?.page ?? page}
            limit={inquiries.data?.limit ?? INQUIRY_LIST_LIMIT}
            total={inquiries.data?.total ?? 0}
            hasMore={inquiries.data?.hasMore ?? false}
            isFetching={inquiries.isFetching}
            onPageChange={(next) =>
              updateParams({ [PAGE]: next > 1 ? String(next) : undefined })
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title={isFiltered ? 'No inquiries match' : 'No inquiries yet'}
          description={
            isFiltered
              ? 'Try another status or type.'
              : 'When a shopper asks for a custom piece, a bulk order or anything else through the contact page, it lands here.'
          }
          action={
            isFiltered ? (
              <Button
                variant="outline"
                onClick={() =>
                  updateParams({
                    [STATUS]: undefined,
                    [TYPE]: undefined,
                    [PAGE]: undefined,
                  })
                }
              >
                Show all inquiries
              </Button>
            ) : undefined
          }
        />
      )}

      <InquiryDialog
        open={isViewOpen}
        inquiry={viewing}
        onClose={() => setIsViewOpen(false)}
        onUpdated={setViewing}
        onDelete={(inquiry) => {
          setIsViewOpen(false);
          setDeleteTarget(inquiry);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete inquiry"
        variant="destructive"
        confirmLabel="Delete"
        isPending={deleteInquiry.isPending}
        onConfirm={handleDelete}
        description={
          <p>
            This permanently deletes the message from{' '}
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {deleteTarget?.name}
            </span>
            . To keep it but take it off your list, mark it closed instead.
          </p>
        }
      />
    </div>
  );
};

export default InquiriesPage;
