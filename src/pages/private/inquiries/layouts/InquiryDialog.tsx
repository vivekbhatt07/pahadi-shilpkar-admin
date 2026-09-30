import { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { Loader2, Mail, MessageCircle, Phone, Trash2 } from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/helpers/format';
import { useUpdateInquiry } from '@/hooks/inquiries';
import { cn } from '@/lib/utils';
import type { Inquiry, UpdateInquiryPayload } from '@/types/api';

import {
  INQUIRY_NOTE_MAX,
  INQUIRY_STATUS_BADGES,
  INQUIRY_STATUSES,
  INQUIRY_TYPE_LABELS,
} from '../constants';
import { toMailtoUrl, toTelUrl, toWhatsAppUrl } from '../helpers';

type TInquiryDialogProps = {
  open: boolean;
  /** Kept after closing, so the content doesn't vanish mid-animation. */
  inquiry: Inquiry | null;
  onClose: () => void;
  /** Called with the saved inquiry after a status or note change. */
  onUpdated: (inquiry: Inquiry) => void;
  onDelete: (inquiry: Inquiry) => void;
};

const SECTION_LABEL = 'text-xs font-medium text-stone-500 dark:text-stone-400';

/** Keyed by inquiry, so an unsaved note never leaks into the next one. */
const InquiryDetails = ({
  inquiry,
  onClose,
  onUpdated,
  onDelete,
}: Omit<TInquiryDialogProps, 'open' | 'inquiry'> & { inquiry: Inquiry }) => {
  const updateInquiry = useUpdateInquiry();
  const [note, setNote] = useState(inquiry.adminNote ?? '');
  const noteId = useId();

  const isNoteChanged = note.trim() !== (inquiry.adminNote ?? '');
  const isSavingNote =
    updateInquiry.isPending &&
    updateInquiry.variables?.payload.adminNote !== undefined;

  const save = (payload: UpdateInquiryPayload) =>
    updateInquiry.mutate(
      { id: inquiry.id, payload },
      { onSuccess: (response) => response.data && onUpdated(response.data) },
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{inquiry.name}</DialogTitle>
        <DialogDescription>
          {INQUIRY_TYPE_LABELS[inquiry.type]} · received{' '}
          {formatDateTime(inquiry.createdAt)}
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-px">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={toMailtoUrl(inquiry.email)}>
              <Mail />
              <span className="max-w-56 truncate">{inquiry.email}</span>
            </a>
          </Button>
          {inquiry.phone && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={toTelUrl(inquiry.phone)}>
                  <Phone />
                  {inquiry.phone}
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={toWhatsAppUrl(inquiry.phone, inquiry.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle />
                  WhatsApp
                </a>
              </Button>
            </>
          )}
        </div>

        {(inquiry.product || inquiry.quantity !== null || inquiry.userId) && (
          <dl className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50/60 p-3 text-sm sm:grid-cols-2 dark:border-stone-700 dark:bg-stone-800/30">
            {inquiry.product && (
              <div className="sm:col-span-2">
                <dt className={SECTION_LABEL}>About</dt>
                <dd className="mt-1">
                  <RouterLink
                    to={ROUTES.PRIVATE.PRODUCTS.DETAIL(inquiry.product.slug)}
                    className="flex items-center gap-2.5 font-medium text-stone-900 transition-colors hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
                  >
                    <ImageThumb
                      src={inquiry.product.images[0]}
                      alt=""
                      className="size-8"
                    />
                    <span className="truncate">{inquiry.product.name}</span>
                  </RouterLink>
                </dd>
              </div>
            )}
            {inquiry.quantity !== null && (
              <div>
                <dt className={SECTION_LABEL}>Quantity</dt>
                <dd className="mt-1 font-medium text-stone-900 dark:text-stone-50">
                  {inquiry.quantity.toLocaleString('en-IN')} pieces
                </dd>
              </div>
            )}
            {inquiry.userId && (
              <div>
                <dt className={SECTION_LABEL}>Sent by</dt>
                <dd className="mt-1 font-medium text-stone-900 dark:text-stone-50">
                  A signed-in customer
                </dd>
              </div>
            )}
          </dl>
        )}

        <div>
          <p className={SECTION_LABEL}>Message</p>
          <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-stone-800 dark:text-stone-200">
            {inquiry.message}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p id={`${noteId}-status`} className={SECTION_LABEL}>
            Status
          </p>
          <div
            role="group"
            aria-labelledby={`${noteId}-status`}
            className="flex w-fit rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
          >
            {INQUIRY_STATUSES.map((status) => {
              const isCurrent = inquiry.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={isCurrent}
                  disabled={updateInquiry.isPending}
                  onClick={() => !isCurrent && save({ status })}
                  className={cn(
                    'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30 disabled:cursor-default',
                    isCurrent
                      ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-stone-50'
                      : 'text-stone-500 hover:text-stone-900 disabled:opacity-60 dark:text-stone-400 dark:hover:text-stone-50',
                  )}
                >
                  {INQUIRY_STATUS_BADGES[status].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={noteId}>Private note</Label>
            <span className="text-xs text-stone-400 tabular-nums dark:text-stone-500">
              {note.length}/{INQUIRY_NOTE_MAX}
            </span>
          </div>
          <Textarea
            id={noteId}
            rows={3}
            value={note}
            maxLength={INQUIRY_NOTE_MAX}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Quoted ₹4,500 for 30 diyas — waiting on their event date."
            disabled={isSavingNote}
          />
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Only admins see this.
          </p>
        </div>
      </div>

      <DialogFooter className="sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onDelete(inquiry)}
          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
        >
          <Trash2 />
          Delete
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => save({ adminNote: note.trim() || null })}
            disabled={!isNoteChanged || updateInquiry.isPending}
            startAdornment={
              isSavingNote ? <Loader2 className="animate-spin" /> : undefined
            }
          >
            Save note
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};

/** One inquiry in full, with reply links, its status and a private note. */
const InquiryDialog = ({ open, inquiry, ...props }: TInquiryDialogProps) => (
  <Dialog
    open={open && inquiry !== null}
    onOpenChange={(next) => !next && props.onClose()}
  >
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg md:max-w-lg">
      {inquiry && (
        <InquiryDetails key={inquiry.id} inquiry={inquiry} {...props} />
      )}
    </DialogContent>
  </Dialog>
);

export default InquiryDialog;
