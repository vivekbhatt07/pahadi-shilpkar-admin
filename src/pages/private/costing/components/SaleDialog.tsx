import { useState } from 'react';
import dayjs from 'dayjs';
import { Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/helpers/format';
import {
  useCostingSettings,
  useCreateSale,
  useUpdateSale,
} from '@/hooks/costing';
import { cn } from '@/lib/utils';
import type {
  CreateSalePayload,
  Sale,
  SaleChannel,
  SaleItemPayload,
} from '@/types/api';

import { COSTING_LIMITS, SALE_CHANNELS } from '../constants';
import {
  channelFeeOn,
  formatPercent,
  includedTax,
  listingName,
  roundMoney,
} from '../helpers';
import SaleItemPicker from './SaleItemPicker';

type TDraftItem = {
  key: string;
  productId: string | null;
  variantId: string | null;
  comboId: string | null;
  /** Shown on the picker; for a custom piece, typed. */
  name: string;
  custom: boolean;
  quantity: string;
  unitPrice: string;
  unitCost: string;
};

type TDraft = {
  soldOn: string;
  channel: SaleChannel;
  customerName: string;
  customerPhone: string;
  items: TDraftItem[];
  discount: string;
  deliveryCharged: string;
  deliveryCost: string;
  /** null = worked out from the costing settings as the sale changes. */
  channelFee: string | null;
  tax: string | null;
  otherCost: string;
  note: string;
  deductStock: boolean;
};

let itemCounter = 0;
const nextKey = () => `item-${++itemCounter}`;

const blankItem = (): TDraftItem => ({
  key: nextKey(),
  productId: null,
  variantId: null,
  comboId: null,
  name: '',
  custom: false,
  quantity: '1',
  unitPrice: '',
  unitCost: '',
});

const money = (value: number) => String(roundMoney(value));

const toDraft = (sale?: Sale | null): TDraft =>
  sale
    ? {
        soldOn: dayjs(sale.soldAt).format('YYYY-MM-DD'),
        channel: sale.channel,
        customerName: sale.customerName ?? '',
        customerPhone: sale.customerPhone ?? '',
        items: sale.items.map((item) => ({
          key: nextKey(),
          productId: item.productId,
          variantId: item.variantId,
          comboId: item.comboId,
          name: item.name,
          custom: !item.productId && !item.comboId,
          quantity: String(item.quantity),
          unitPrice: money(item.unitPrice),
          unitCost: money(item.unitCost),
        })),
        discount: sale.discount ? money(sale.discount) : '',
        deliveryCharged: sale.deliveryCharged
          ? money(sale.deliveryCharged)
          : '',
        deliveryCost: sale.deliveryCost ? money(sale.deliveryCost) : '',
        // Kept as saved — never worked out again behind the admin's back
        channelFee: money(sale.channelFee),
        tax: money(sale.tax),
        otherCost: sale.otherCost ? money(sale.otherCost) : '',
        note: sale.note ?? '',
        deductStock: sale.stockDeducted,
      }
    : {
        soldOn: dayjs().format('YYYY-MM-DD'),
        channel: 'WHATSAPP',
        customerName: '',
        customerPhone: '',
        items: [blankItem()],
        discount: '',
        deliveryCharged: '',
        deliveryCost: '',
        channelFee: null,
        tax: null,
        otherCost: '',
        note: '',
        deductStock: true,
      };

const MONEY_REGEX = /^\d+(?:\.\d{1,2})?$/;
const amount = (value: string) => (value === '' ? 0 : Number(value));
const isMoney = (value: string) => value === '' || MONEY_REGEX.test(value);

const labelClass =
  'flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400';

const Row = ({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'good' | 'bad';
}) => (
  <div className="flex items-center justify-between gap-3">
    <dt
      className={cn(strong && 'font-medium text-stone-900 dark:text-stone-50')}
    >
      {label}
    </dt>
    <dd
      className={cn(
        'tabular-nums',
        strong && 'font-semibold',
        tone === 'good' && 'text-emerald-700 dark:text-emerald-400',
        tone === 'bad' && 'text-red-600 dark:text-red-400',
      )}
    >
      {value}
    </dd>
  </div>
);

const SaleForm = ({
  sale,
  onClose,
}: {
  sale?: Sale | null;
  onClose: () => void;
}) => {
  const settings = useCostingSettings();
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();
  const [draft, setDraft] = useState(() => toDraft(sale));
  const [showErrors, setShowErrors] = useState(false);
  const isPending = createSale.isPending || updateSale.isPending;

  const set = (changes: Partial<TDraft>) => setDraft({ ...draft, ...changes });
  const setItem = (key: string, changes: Partial<TDraftItem>) =>
    set({
      items: draft.items.map((item) =>
        item.key === key ? { ...item, ...changes } : item,
      ),
    });

  const itemsTotal = draft.items.reduce(
    (sum, item) => sum + amount(item.quantity) * amount(item.unitPrice),
    0,
  );
  const costOfGoods = draft.items.reduce(
    (sum, item) => sum + amount(item.quantity) * amount(item.unitCost),
    0,
  );
  const paid =
    itemsTotal - amount(draft.discount) + amount(draft.deliveryCharged);
  const autoFee = settings.data
    ? roundMoney(channelFeeOn(paid, settings.data, draft.channel))
    : 0;
  const autoTax = settings.data
    ? roundMoney(includedTax(paid, settings.data.taxPercent))
    : 0;
  const channelFee =
    draft.channelFee === null ? autoFee : amount(draft.channelFee);
  const tax = draft.tax === null ? autoTax : amount(draft.tax);
  const net = paid - tax;
  const profit =
    net -
    costOfGoods -
    amount(draft.deliveryCost) -
    channelFee -
    amount(draft.otherCost);
  const margin = net > 0 ? (profit / net) * 100 : null;

  const itemProblem = (item: TDraftItem): string | null => {
    if (item.custom ? !item.name.trim() : !item.productId && !item.comboId) {
      return item.custom ? 'Name the piece' : 'Pick what was sold';
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return 'Quantity is a whole number above 0';
    }
    if (item.unitPrice === '' || !isMoney(item.unitPrice)) {
      return 'Enter the price it sold at';
    }
    if (!isMoney(item.unitCost)) return 'Enter what one cost to make';
    return null;
  };
  const problems = draft.items.map(itemProblem);
  const formProblem =
    draft.items.length === 0
      ? 'Add what was sold'
      : ![
            draft.discount,
            draft.deliveryCharged,
            draft.deliveryCost,
            draft.otherCost,
            draft.channelFee ?? '',
            draft.tax ?? '',
          ].every(isMoney)
        ? 'Amounts are in rupees, up to 2 decimals'
        : amount(draft.discount) > itemsTotal
          ? "The discount can't be more than the items cost"
          : !draft.soldOn
            ? 'Pick the date it was sold'
            : null;
  const hasProblem = formProblem !== null || problems.some(Boolean);

  const submit = () => {
    setShowErrors(true);
    if (hasProblem) return;

    const items: SaleItemPayload[] = draft.items.map((item) => ({
      ...(item.comboId
        ? { comboId: item.comboId }
        : item.productId
          ? { productId: item.productId, variantId: item.variantId }
          : {}),
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unitPrice: amount(item.unitPrice),
      unitCost: amount(item.unitCost),
    }));
    const payload: CreateSalePayload = {
      // Noon IST, so the day never slips across midnight
      soldAt: dayjs(`${draft.soldOn}T12:00:00+05:30`).toISOString(),
      channel: draft.channel,
      customerName: draft.customerName.trim() || null,
      customerPhone: draft.customerPhone.trim() || null,
      items,
      discount: amount(draft.discount),
      deliveryCharged: amount(draft.deliveryCharged),
      deliveryCost: amount(draft.deliveryCost),
      channelFee,
      tax,
      otherCost: amount(draft.otherCost),
      note: draft.note.trim() || null,
      deductStock: draft.deductStock,
    };

    if (sale) {
      updateSale.mutate({ id: sale.id, payload }, { onSuccess: onClose });
    } else {
      createSale.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className={labelClass}>
          Sold on
          <Input
            type="date"
            max={dayjs().format('YYYY-MM-DD')}
            value={draft.soldOn}
            onChange={(event) => set({ soldOn: event.target.value })}
            disabled={isPending}
          />
        </label>
        <label className={labelClass}>
          Through
          <Select
            value={draft.channel}
            onValueChange={(channel) =>
              set({ channel: channel as SaleChannel })
            }
            disabled={isPending}
          >
            <SelectTrigger aria-label="Through">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SALE_CHANNELS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className={labelClass}>
          Customer
          <Input
            placeholder="Optional"
            maxLength={COSTING_LIMITS.CUSTOMER_NAME_MAX}
            value={draft.customerName}
            onChange={(event) => set({ customerName: event.target.value })}
            disabled={isPending}
          />
        </label>
        <label className={labelClass}>
          Phone
          <Input
            type="tel"
            placeholder="Optional"
            maxLength={COSTING_LIMITS.CUSTOMER_PHONE_MAX}
            value={draft.customerPhone}
            onChange={(event) => set({ customerPhone: event.target.value })}
            disabled={isPending}
          />
        </label>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
          What was sold
        </h3>
        <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_7rem_7rem_2rem] gap-2 px-1 text-[11px] font-semibold tracking-wider text-stone-400 uppercase sm:grid">
          <span>Item</span>
          <span>Qty</span>
          <span>Sold at</span>
          <span>Cost each</span>
          <span />
        </div>
        <ul className="flex flex-col gap-2">
          {draft.items.map((item, index) => (
            <li key={item.key} className="flex flex-col gap-1">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_7rem_7rem_2rem] sm:items-center">
                <div className="col-span-3 sm:col-span-1">
                  {item.custom ? (
                    <Input
                      autoFocus
                      placeholder="Custom name plate, 12 inch"
                      aria-label="Custom piece"
                      maxLength={COSTING_LIMITS.SALE_ITEM_NAME_MAX}
                      value={item.name}
                      onChange={(event) =>
                        setItem(item.key, { name: event.target.value })
                      }
                      disabled={isPending}
                    />
                  ) : (
                    <SaleItemPicker
                      label={item.name}
                      invalid={showErrors && Boolean(problems[index])}
                      disabled={isPending}
                      onPick={(listing) =>
                        setItem(item.key, {
                          productId: listing.productId,
                          variantId: listing.variantId,
                          comboId: listing.comboId,
                          name: listingName(listing),
                          unitPrice: money(listing.price),
                          unitCost:
                            listing.unitCost === null
                              ? ''
                              : money(listing.unitCost),
                        })
                      }
                      onCustom={() =>
                        setItem(item.key, {
                          ...blankItem(),
                          key: item.key,
                          custom: true,
                          quantity: item.quantity,
                        })
                      }
                    />
                  )}
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={COSTING_LIMITS.SALE_ITEM_QUANTITY_MAX}
                  step={1}
                  aria-label="Quantity"
                  value={item.quantity}
                  onChange={(event) =>
                    setItem(item.key, { quantity: event.target.value })
                  }
                  disabled={isPending}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  aria-label="Sold at"
                  placeholder="Price"
                  startAdornment={
                    <span className="text-sm text-stone-400">₹</span>
                  }
                  value={item.unitPrice}
                  onChange={(event) =>
                    setItem(item.key, { unitPrice: event.target.value })
                  }
                  disabled={isPending}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  aria-label="Cost each"
                  placeholder="0"
                  startAdornment={
                    <span className="text-sm text-stone-400">₹</span>
                  }
                  value={item.unitCost}
                  onChange={(event) =>
                    setItem(item.key, { unitCost: event.target.value })
                  }
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    set({
                      items: draft.items.filter(
                        (candidate) => candidate.key !== item.key,
                      ),
                    })
                  }
                  disabled={isPending || draft.items.length === 1}
                  aria-label="Remove item"
                  className="justify-self-end text-stone-400 hover:text-red-600"
                >
                  <Trash2 />
                </Button>
              </div>
              {showErrors && problems[index] && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {problems[index]}
                </p>
              )}
            </li>
          ))}
        </ul>
        {draft.items.length < COSTING_LIMITS.SALE_ITEMS_MAX && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => set({ items: [...draft.items, blankItem()] })}
            disabled={isPending}
            startAdornment={<Plus />}
            className="w-fit"
          >
            Add another item
          </Button>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="grid grid-cols-2 gap-3 self-start sm:grid-cols-3">
          {(
            [
              ['discount', 'Discount given'],
              ['deliveryCharged', 'Buyer paid for delivery'],
              ['deliveryCost', 'Courier cost you'],
              ['otherCost', 'Other costs'],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className={labelClass}>
              {label}
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0"
                startAdornment={
                  <span className="text-sm text-stone-400">₹</span>
                }
                value={draft[field]}
                onChange={(event) => set({ [field]: event.target.value })}
                disabled={isPending}
              />
            </label>
          ))}
          {(
            [
              ['channelFee', 'Channel cut', autoFee],
              ['tax', 'Tax included', autoTax],
            ] as const
          ).map(([field, label, auto]) => (
            <label key={field} className={labelClass}>
              <span className="flex items-center justify-between">
                {label}
                {draft[field] === null ? (
                  <span className="font-normal text-stone-400">auto</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => set({ [field]: null })}
                    className="inline-flex cursor-pointer items-center gap-0.5 font-normal text-accent-700 dark:text-accent-400"
                  >
                    <RotateCcw className="size-3" />
                    {formatPrice(auto)}
                  </button>
                )}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                startAdornment={
                  <span className="text-sm text-stone-400">₹</span>
                }
                value={draft[field] ?? String(auto)}
                onChange={(event) => set({ [field]: event.target.value })}
                disabled={isPending}
              />
            </label>
          ))}
        </div>

        <dl className="flex flex-col gap-1.5 rounded-lg bg-stone-50 p-3 text-sm text-stone-600 dark:bg-stone-900/60 dark:text-stone-300">
          <Row label="Items" value={formatPrice(roundMoney(itemsTotal))} />
          {amount(draft.discount) > 0 && (
            <Row
              label="Discount"
              value={`− ${formatPrice(amount(draft.discount))}`}
            />
          )}
          {amount(draft.deliveryCharged) > 0 && (
            <Row
              label="Delivery charged"
              value={`+ ${formatPrice(amount(draft.deliveryCharged))}`}
            />
          )}
          <Row
            label="Buyer paid"
            value={formatPrice(roundMoney(paid))}
            strong
          />
          <Row
            label="Cost to make"
            value={`− ${formatPrice(roundMoney(costOfGoods))}`}
          />
          <Row
            label="Fees, tax & sending"
            value={`− ${formatPrice(
              roundMoney(
                tax +
                  channelFee +
                  amount(draft.deliveryCost) +
                  amount(draft.otherCost),
              ),
            )}`}
          />
          <div className="my-1 border-t border-stone-200 dark:border-stone-700" />
          <Row
            label={`Profit${margin === null ? '' : ` · ${formatPercent(Math.round(margin * 10) / 10)}`}`}
            value={formatPrice(roundMoney(profit))}
            strong
            tone={profit < 0 ? 'bad' : 'good'}
          />
        </dl>
      </div>

      <label className={labelClass}>
        Note
        <Textarea
          rows={2}
          maxLength={COSTING_LIMITS.SALE_NOTE_MAX}
          placeholder="Order number, gift message, anything to remember"
          value={draft.note}
          onChange={(event) => set({ note: event.target.value })}
          disabled={isPending}
        />
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
        <Checkbox
          checked={draft.deductStock}
          onCheckedChange={(checked) => set({ deductStock: checked === true })}
          className="mt-0.5"
        />
        <span>
          Take it out of stock
          <span className="block text-xs text-stone-400 dark:text-stone-500">
            {sale?.stockDeducted
              ? 'Its stock moves with any change to the items — unticked, what it took goes back.'
              : 'A combo takes each of its items. Untick it for made-to-order pieces or stock you count yourself.'}
          </span>
        </span>
      </label>

      {showErrors && formProblem && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {formProblem}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          startAdornment={
            isPending ? <Loader2 className="animate-spin" /> : undefined
          }
        >
          {sale ? 'Save sale' : 'Record sale'}
        </Button>
      </DialogFooter>
    </form>
  );
};

type TSaleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edits it when set; records a new one otherwise. */
  sale?: Sale | null;
};

/** An order taken off the storefront — on WhatsApp, at a mela, on Amazon. */
const SaleDialog = ({ open, onOpenChange, sale }: TSaleDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl md:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{sale ? 'Edit sale' : 'Record a sale'}</DialogTitle>
        <DialogDescription>
          What was sold, at what price, and what it cost — prices and costs fill
          in from the catalog and its cost sheets, and stay as entered.
        </DialogDescription>
      </DialogHeader>
      {open && (
        <SaleForm
          key={sale?.id ?? 'new'}
          sale={sale}
          onClose={() => onOpenChange(false)}
        />
      )}
    </DialogContent>
  </Dialog>
);

export default SaleDialog;
