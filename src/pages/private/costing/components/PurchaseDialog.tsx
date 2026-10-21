import { useState } from 'react';
import dayjs from 'dayjs';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRecordPurchase } from '@/hooks/costing';
import type { RawMaterial } from '@/types/api';

import { COSTING_LIMITS, UNIT_SHORT } from '../constants';
import { formatUnitCost } from '../helpers';

type TPurchaseDialogProps = {
  /** The material bought; null closes the dialog. */
  material: Pick<
    RawMaterial,
    'id' | 'name' | 'unit' | 'unitCost' | 'supplier'
  > | null;
  onClose: () => void;
};

const labelClass =
  'flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400';

const QUANTITY_REGEX = /^\d+(?:\.\d{1,3})?$/;
const MONEY_REGEX = /^\d+(?:\.\d{1,2})?$/;

const PurchaseForm = ({
  material,
  onClose,
}: TPurchaseDialogProps & {
  material: NonNullable<TPurchaseDialogProps['material']>;
}) => {
  const recordPurchase = useRecordPurchase();
  const [quantity, setQuantity] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [purchasedOn, setPurchasedOn] = useState(dayjs().format('YYYY-MM-DD'));
  const [supplier, setSupplier] = useState(material.supplier ?? '');
  const [note, setNote] = useState('');
  const [updateUnitCost, setUpdateUnitCost] = useState(true);

  const unit = UNIT_SHORT[material.unit];
  const unitCost =
    Number(quantity) > 0 && totalCost !== ''
      ? Number(totalCost) / Number(quantity)
      : null;
  const problem =
    !QUANTITY_REGEX.test(quantity) || !(Number(quantity) > 0)
      ? `Enter how many ${unit} you bought — up to 3 decimals`
      : !MONEY_REGEX.test(totalCost)
        ? 'Enter what you paid in all — up to 2 decimals'
        : !purchasedOn
          ? 'Pick the date of the purchase'
          : null;
  const isOld = dayjs(purchasedOn).isBefore(dayjs().subtract(30, 'day'), 'day');

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (problem) return;
        recordPurchase.mutate(
          {
            id: material.id,
            payload: {
              quantity: Number(quantity),
              totalCost: Number(totalCost),
              // Noon IST, so the day never slips across midnight
              purchasedAt: dayjs(`${purchasedOn}T12:00:00+05:30`).toISOString(),
              ...(supplier.trim() && { supplier: supplier.trim() }),
              ...(note.trim() && { note: note.trim() }),
              updateUnitCost,
            },
          },
          { onSuccess: onClose },
        );
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Bought ({unit})
          <Input
            autoFocus
            type="number"
            inputMode="decimal"
            min={0}
            step="0.001"
            placeholder="100"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={recordPurchase.isPending}
          />
        </label>
        <label className={labelClass}>
          Paid in all
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="1500"
            startAdornment={<span className="text-sm text-stone-400">₹</span>}
            value={totalCost}
            onChange={(event) => setTotalCost(event.target.value)}
            disabled={recordPurchase.isPending}
          />
        </label>
        <label className={labelClass}>
          On
          <Input
            type="date"
            max={dayjs().format('YYYY-MM-DD')}
            value={purchasedOn}
            onChange={(event) => setPurchasedOn(event.target.value)}
            disabled={recordPurchase.isPending}
          />
        </label>
        <label className={labelClass}>
          From
          <Input
            placeholder="Supplier"
            maxLength={COSTING_LIMITS.MATERIAL_SUPPLIER_MAX}
            value={supplier}
            onChange={(event) => setSupplier(event.target.value)}
            disabled={recordPurchase.isPending}
          />
        </label>
      </div>
      <label className={labelClass}>
        Note
        <Input
          placeholder="Optional — bill number, quality"
          maxLength={COSTING_LIMITS.PURCHASE_NOTE_MAX}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={recordPurchase.isPending}
        />
      </label>

      {unitCost !== null && (
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600 dark:bg-stone-900/60 dark:text-stone-300">
          That's{' '}
          <span className="font-semibold text-stone-900 tabular-nums dark:text-stone-50">
            {formatUnitCost(
              Math.round(unitCost * 10000) / 10000,
              material.unit,
            )}
          </span>{' '}
          — it's {formatUnitCost(material.unitCost, material.unit)} now.
        </p>
      )}

      <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
        <Checkbox
          checked={updateUnitCost}
          onCheckedChange={(checked) => setUpdateUnitCost(checked === true)}
          className="mt-0.5"
        />
        <span>
          Make this the material's cost
          <span className="block text-xs text-stone-400 dark:text-stone-500">
            {isOld
              ? 'This is an old bill — you may want to leave today’s cost as it is.'
              : 'Every product using it is costed at the new price.'}
          </span>
        </span>
      </label>

      {problem && (quantity !== '' || totalCost !== '') && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {problem}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={problem !== null || recordPurchase.isPending}
          startAdornment={
            recordPurchase.isPending ? (
              <Loader2 className="animate-spin" />
            ) : undefined
          }
        >
          Record purchase
        </Button>
      </DialogFooter>
    </form>
  );
};

/** One time a material was bought — its price becomes the cost, if wanted. */
const PurchaseDialog = ({ material, onClose }: TPurchaseDialogProps) => (
  <Dialog open={material !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Record a purchase</DialogTitle>
        <DialogDescription>
          {material?.name} — in {material ? UNIT_SHORT[material.unit] : ''}: a
          pack of 100 plates is 100, a 500 ml bottle is 500.
        </DialogDescription>
      </DialogHeader>
      {material && (
        <PurchaseForm key={material.id} material={material} onClose={onClose} />
      )}
    </DialogContent>
  </Dialog>
);

export default PurchaseDialog;
