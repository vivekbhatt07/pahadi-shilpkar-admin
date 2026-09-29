import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import CategoryTreePicker from '@/components/custom/CategoryTreePicker';
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

type TMoveProductsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  isPending?: boolean;
  onConfirm: (categoryId: string) => void;
};

/**
 * Body in its own component so the picked category resets on its own —
 * Radix unmounts DialogContent whenever the dialog closes.
 */
const MoveProductsBody = ({
  onOpenChange,
  count,
  isPending,
  onConfirm,
}: Omit<TMoveProductsDialogProps, 'open'>) => {
  const [categoryId, setCategoryId] = useState<string | null>(null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Move {count} {count === 1 ? 'product' : 'products'}
        </DialogTitle>
        <DialogDescription>
          Pick the category they should belong to. Any depth works — choose the
          most specific one.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="move-products-category">Category</Label>
        <CategoryTreePicker
          id="move-products-category"
          value={categoryId}
          onChange={setCategoryId}
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
          type="button"
          onClick={() => categoryId && onConfirm(categoryId)}
          disabled={!categoryId || isPending}
          startAdornment={
            isPending ? <Loader2 className="animate-spin" /> : undefined
          }
        >
          Move products
        </Button>
      </DialogFooter>
    </>
  );
};

const MoveProductsDialog = ({
  open,
  onOpenChange,
  isPending,
  ...props
}: TMoveProductsDialogProps) => (
  <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
    <DialogContent>
      <MoveProductsBody
        onOpenChange={onOpenChange}
        isPending={isPending}
        {...props}
      />
    </DialogContent>
  </Dialog>
);

export default MoveProductsDialog;
