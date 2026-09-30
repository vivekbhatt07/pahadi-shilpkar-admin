import { Link as RouterLink } from 'react-router';
import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { Inquiry } from '@/types/api';

import { INQUIRY_STATUS_BADGES, INQUIRY_TYPE_LABELS } from '../constants';

type TInquiriesTableProps = {
  inquiries: Inquiry[];
  onOpen: (inquiry: Inquiry) => void;
  onDelete: (inquiry: Inquiry) => void;
};

/** Newest first. A row click opens the inquiry; the sender's name is the keyboard way in. */
const InquiriesTable = ({
  inquiries,
  onOpen,
  onDelete,
}: TInquiriesTableProps) => (
  <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
    <Table>
      <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
        <TableRow>
          {/* Phones get one column — the sender cell carries the rest, and delete lives in the dialog */}
          <TableHead className="sm:min-w-48">From</TableHead>
          <TableHead className="hidden w-36 md:table-cell">Type</TableHead>
          <TableHead className="hidden min-w-64 sm:table-cell">
            Message
          </TableHead>
          <TableHead className="hidden w-28 sm:table-cell">Status</TableHead>
          <TableHead className="hidden w-40 lg:table-cell">Received</TableHead>
          <TableHead className="hidden w-14 text-right sm:table-cell">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inquiries.map((inquiry) => {
          const isNew = inquiry.status === 'NEW';
          const badge = INQUIRY_STATUS_BADGES[inquiry.status];
          const details = [
            inquiry.product && `About ${inquiry.product.name}`,
            inquiry.quantity !== null &&
              `${inquiry.quantity.toLocaleString('en-IN')} pieces`,
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <TableRow
              key={inquiry.id}
              onClick={() => onOpen(inquiry)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      isNew && 'bg-accent-500 dark:bg-accent-400',
                    )}
                  />
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(inquiry);
                      }}
                      className={cn(
                        'max-w-full cursor-pointer truncate text-left text-sm text-stone-900 transition-colors hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400',
                        isNew ? 'font-semibold' : 'font-medium',
                      )}
                    >
                      {inquiry.name}
                    </button>
                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                      {inquiry.email}
                    </p>
                    <div className="sm:hidden">
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                        {inquiry.message}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
                        {INQUIRY_TYPE_LABELS[inquiry.type]}
                        {details && ` · ${details}`}
                      </p>
                      <Badge variant={badge.variant} className="mt-1.5">
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">
                  {INQUIRY_TYPE_LABELS[inquiry.type]}
                </Badge>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <p className="line-clamp-1 max-w-md text-sm text-stone-700 dark:text-stone-300">
                  {inquiry.message}
                </p>
                <p
                  className={cn(
                    'mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400',
                    !details && 'md:hidden',
                  )}
                >
                  {/* The type has its own column from md up */}
                  <span className="md:hidden">
                    {INQUIRY_TYPE_LABELS[inquiry.type]}
                    {details && ' · '}
                  </span>
                  {inquiry.product && (
                    <>
                      About{' '}
                      <RouterLink
                        to={ROUTES.PRIVATE.PRODUCTS.DETAIL(
                          inquiry.product.slug,
                        )}
                        // The row opens the inquiry; this link goes to the product
                        onClick={(event) => event.stopPropagation()}
                        className="font-medium text-stone-700 underline-offset-2 hover:text-accent-600 hover:underline dark:text-stone-300 dark:hover:text-accent-400"
                      >
                        {inquiry.product.name}
                      </RouterLink>
                    </>
                  )}
                  {inquiry.product && inquiry.quantity !== null && ' · '}
                  {inquiry.quantity !== null &&
                    `${inquiry.quantity.toLocaleString('en-IN')} pieces`}
                </p>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>

              <TableCell className="hidden text-xs whitespace-nowrap text-stone-500 lg:table-cell dark:text-stone-400">
                {formatDateTime(inquiry.createdAt)}
              </TableCell>

              <TableCell className="hidden text-right sm:table-cell">
                <SimpleTooltip label="Delete">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(inquiry);
                    }}
                    aria-label={`Delete the inquiry from ${inquiry.name}`}
                    className="text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                  >
                    <Trash2 />
                  </Button>
                </SimpleTooltip>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default InquiriesTable;
