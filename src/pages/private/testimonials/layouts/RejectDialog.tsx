import { useState } from 'react';
import { Loader2 } from 'lucide-react';

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
import { cn } from '@/lib/utils';

import { REJECTION_REASON_PRESETS, TESTIMONIAL_LIMITS } from '../constants';

type TRejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many testimonials are being rejected. */
  count: number;
  /** The author, when it's one testimonial. */
  authorName?: string;
  isPending: boolean;
  /** An empty reason rejects without one. */
  onConfirm: (reason: string) => void;
};

/**
 * Body in its own component so the reason resets naturally: Radix unmounts
 * DialogContent whenever the dialog closes.
 */
const RejectDialogBody = ({
  onOpenChange,
  count,
  authorName,
  isPending,
  onConfirm,
}: Omit<TRejectDialogProps, 'open'>) => {
  const [reason, setReason] = useState('');
  const many = count > 1;

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm(reason.trim());
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {many ? `Reject ${count} testimonials` : 'Reject testimonial'}
        </DialogTitle>
        <DialogDescription>
          {many
            ? 'They leave the storefront, if they were on it. Each author sees the reason below and can edit and resubmit.'
            : `It leaves the storefront, if it was on it. ${authorName ?? 'The author'} sees the reason below and can edit and resubmit.`}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rejection-reason">
            Reason{' '}
            <span className="font-normal text-stone-400">
              (shown to the author)
            </span>
          </Label>
          <span className="text-xs text-stone-400 tabular-nums dark:text-stone-500">
            {reason.length}/{TESTIMONIAL_LIMITS.REJECTION_REASON_MAX}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REJECTION_REASON_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setReason(preset)}
              disabled={isPending}
              className={cn(
                'cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30',
                reason === preset
                  ? 'border-accent-300 bg-accent-50 text-accent-800 dark:border-accent-800 dark:bg-accent-950/50 dark:text-accent-200'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800',
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <Textarea
          id="rejection-reason"
          rows={3}
          value={reason}
          maxLength={TESTIMONIAL_LIMITS.REJECTION_REASON_MAX}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional — e.g. please leave out your phone number"
          disabled={isPending}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={isPending}
          startAdornment={
            isPending ? <Loader2 className="animate-spin" /> : undefined
          }
        >
          {many ? `Reject ${count}` : 'Reject'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const RejectDialog = ({ open, onOpenChange, ...props }: TRejectDialogProps) => (
  <Dialog open={open} onOpenChange={props.isPending ? undefined : onOpenChange}>
    <DialogContent>
      <RejectDialogBody onOpenChange={onOpenChange} {...props} />
    </DialogContent>
  </Dialog>
);

export default RejectDialog;
