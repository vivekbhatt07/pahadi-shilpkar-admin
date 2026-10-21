import { useState } from 'react';
import { ClipboardCopy, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { formatPrice } from '@/helpers/format';
import {
  useDeleteCostSheet,
  useMaterials,
  useSaveCostSheet,
} from '@/hooks/costing';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { cn } from '@/lib/utils';
import type {
  CostBreakdown,
  CostLine,
  CostLinePayload,
  CostLineType,
  CostSheet,
  SaveCostSheetPayload,
} from '@/types/api';

import { COST_LINE_TYPES, COSTING_LIMITS, UNIT_SHORT } from '../constants';
import { lineCost, roundMoney, sheetTotals } from '../helpers';
import MaterialDialog from './MaterialDialog';
import MaterialPicker, { type TPickable } from './MaterialPicker';

/** A line as it's being edited — numbers kept as typed. */
type TDraftLine = {
  key: string;
  type: CostLineType;
  materialId: string | null;
  /** The saved line's material, so a switched-off one still shows. */
  savedMaterial: CostLine['material'];
  quantity: string;
  wastagePercent: string;
  label: string;
  amount: string;
};

type TDraft = { batchSize: string; notes: string; lines: TDraftLine[] };

let lineCounter = 0;
const nextKey = () => `line-${++lineCounter}`;

const toDraftLine = (line: CostLine): TDraftLine => ({
  key: nextKey(),
  type: line.type,
  materialId: line.materialId,
  savedMaterial: line.material,
  quantity: line.quantity === null ? '' : String(line.quantity),
  wastagePercent: line.wastagePercent ? String(line.wastagePercent) : '',
  label: line.label ?? '',
  amount: line.amount === null ? '' : String(line.amount),
});

const toDraft = (sheet: CostSheet | null | undefined): TDraft => ({
  batchSize: String(sheet?.batchSize ?? 1),
  notes: sheet?.notes ?? '',
  lines: (sheet?.lines ?? []).map(toDraftLine),
});

const blankLine = (type: CostLineType): TDraftLine => ({
  key: nextKey(),
  type,
  materialId: null,
  savedMaterial: null,
  quantity: '',
  wastagePercent: '',
  label: '',
  amount: '',
});

/** What a draft compares as — keys and display-only fields left out. */
const comparable = (draft: TDraft) =>
  JSON.stringify({
    batchSize: draft.batchSize.trim(),
    notes: draft.notes.trim(),
    lines: draft.lines.map((line) => [
      line.type,
      line.materialId,
      line.quantity,
      line.wastagePercent,
      line.label.trim(),
      line.amount,
    ]),
  });

const QUANTITY_REGEX = /^\d+(?:\.\d{1,3})?$/;
const MONEY_REGEX = /^\d+(?:\.\d{1,2})?$/;

/** What's wrong with a line, or null. */
const lineProblem = (line: TDraftLine): string | null => {
  if (line.type === 'MATERIAL') {
    if (!line.materialId) return 'Pick the material';
    if (!QUANTITY_REGEX.test(line.quantity) || !(Number(line.quantity) > 0)) {
      return 'Enter how much the batch uses — up to 3 decimals';
    }
    if (
      line.wastagePercent !== '' &&
      (!MONEY_REGEX.test(line.wastagePercent) ||
        Number(line.wastagePercent) > 100)
    ) {
      return 'Wastage is a percentage from 0 to 100';
    }
    return null;
  }
  if (!MONEY_REGEX.test(line.amount)) {
    return 'Enter what it costs the batch — up to 2 decimals';
  }
  return null;
};

const toLinePayload = (line: TDraftLine): CostLinePayload =>
  line.type === 'MATERIAL'
    ? {
        type: line.type,
        materialId: line.materialId,
        quantity: Number(line.quantity),
        wastagePercent: line.wastagePercent ? Number(line.wastagePercent) : 0,
        label: line.label.trim() || null,
      }
    : {
        type: line.type,
        label: line.label.trim() || null,
        amount: Number(line.amount),
      };

const numberClass = 'text-right tabular-nums';
const headClass =
  'text-[11px] font-semibold tracking-wider text-stone-400 uppercase';

type TCostSheetEditorProps = {
  /** Exactly one of them — what the sheet is for. */
  target: Pick<SaveCostSheetPayload, 'productId' | 'variantId' | 'comboId'>;
  sheet: CostSheet | null;
  title: string;
  description?: React.ReactNode;
  /**
   * Lines to start from while there's no sheet — a variant starting from its
   * product's, which it costs until it has its own.
   */
  template?: { label: string; sheet: CostSheet } | null;
  /** The live per-piece costs, for the price analysis beside the editor. */
  children?: (unit: CostBreakdown, isDirty: boolean) => React.ReactNode;
};

/**
 * A cost sheet: the materials a batch uses, with what's lost to wastage, and
 * every other cost of the batch — labour, packing, delivery, overheads.
 * Totals work out live, per batch and per piece; saving replaces the sheet
 * as a whole.
 */
const CostSheetEditor = ({
  target,
  sheet,
  title,
  description,
  template,
  children,
}: TCostSheetEditorProps) => {
  const materials = useMaterials({ isActive: true, limit: 100 });
  const saveSheet = useSaveCostSheet();
  const deleteSheet = useDeleteCostSheet();
  const [saved, setSaved] = useState(() => toDraft(sheet));
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newMaterialFor, setNewMaterialFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDirty = comparable(draft) !== comparable(saved);
  useUnsavedChangesWarning(isDirty && !saveSheet.isPending);

  const pickable: TPickable[] = materials.data?.items ?? [];
  const materialOf = (line: TDraftLine) =>
    pickable.find((material) => material.id === line.materialId) ??
    (line.savedMaterial?.id === line.materialId ? line.savedMaterial : null);

  const costOf = (line: TDraftLine) =>
    lineCost(
      {
        type: line.type,
        quantity: line.quantity === '' ? null : Number(line.quantity),
        wastagePercent:
          line.wastagePercent === '' ? null : Number(line.wastagePercent),
        amount: line.amount === '' ? null : Number(line.amount),
      },
      materialOf(line)?.unitCost ?? null,
    );

  const batchSize = Number(draft.batchSize);
  const validBatch =
    Number.isInteger(batchSize) &&
    batchSize >= 1 &&
    batchSize <= COSTING_LIMITS.BATCH_SIZE_MAX;
  const totals = sheetTotals(
    draft.lines.map((line) => ({ type: line.type, cost: costOf(line) })),
    validBatch ? batchSize : 1,
  );
  const perPiece = (cost: number) => cost / (validBatch ? batchSize : 1);

  const setLine = (key: string, changes: Partial<TDraftLine>) => {
    setDraft({
      ...draft,
      lines: draft.lines.map((line) =>
        line.key === key ? { ...line, ...changes } : line,
      ),
    });
    if (errors[key]) setErrors({ ...errors, [key]: '' });
  };
  const addLine = (type: CostLineType) =>
    setDraft({ ...draft, lines: [...draft.lines, blankLine(type)] });
  const removeLine = (key: string) =>
    setDraft({
      ...draft,
      lines: draft.lines.filter((line) => line.key !== key),
    });

  const save = () => {
    const problems = Object.fromEntries(
      draft.lines.flatMap((line) => {
        const problem = lineProblem(line);
        return problem ? [[line.key, problem]] : [];
      }),
    );
    setErrors(problems);
    if (!validBatch || Object.keys(problems).length > 0) return;

    saveSheet.mutate(
      {
        ...target,
        batchSize,
        notes: draft.notes.trim() || null,
        lines: draft.lines.map(toLinePayload),
      },
      {
        onSuccess: (response) => {
          const next = toDraft(response.data);
          setSaved(next);
          setDraft(next);
        },
      },
    );
  };

  const materialLines = draft.lines.filter((line) => line.type === 'MATERIAL');
  const otherLines = draft.lines.filter((line) => line.type !== 'MATERIAL');
  const isPending = saveSheet.isPending || deleteSheet.isPending;
  const isEmpty = !sheet && draft.lines.length === 0;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {isEmpty && template && (
            <Callout
              variant="info"
              title={`Costed as ${template.label} for now`}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      batchSize: String(template.sheet.batchSize),
                      notes: template.sheet.notes ?? '',
                      lines: template.sheet.lines.map(toDraftLine),
                    })
                  }
                >
                  <ClipboardCopy />
                  Start from it
                </Button>
              }
            >
              Give it a sheet of its own only if it's made differently — a
              bigger plate, more lace.
            </Callout>
          )}

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
              One batch makes
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={COSTING_LIMITS.BATCH_SIZE_MAX}
                step={1}
                value={draft.batchSize}
                onChange={(event) =>
                  setDraft({ ...draft, batchSize: event.target.value })
                }
                aria-invalid={!validBatch}
                disabled={isPending}
                endAdornment={
                  <span className="text-xs text-stone-400">pieces</span>
                }
                className="w-36"
              />
            </label>
            <p className="max-w-sm pb-2 text-xs text-stone-400 dark:text-stone-500">
              Enter what the whole batch uses and costs — one bottle of paint
              for 20 thalis — and each piece gets its share.
            </p>
          </div>
          {!validBatch && (
            <p className="-mt-4 text-xs font-medium text-red-600 dark:text-red-400">
              A batch makes a whole number of pieces, from 1 to 1,00,000.
            </p>
          )}

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
                Raw materials
              </h3>
              <span className="text-xs text-stone-500 tabular-nums dark:text-stone-400">
                {formatPrice(roundMoney(totals.unit.MATERIAL))} a piece
              </span>
            </div>
            {materialLines.length > 0 && (
              <div className="hidden grid-cols-[minmax(0,1fr)_7rem_5rem_6rem_2rem] gap-2 px-1 sm:grid">
                <span className={headClass}>Material</span>
                <span className={headClass}>Batch uses</span>
                <span className={headClass}>Wastage</span>
                <span className={cn(headClass, 'text-right')}>Cost</span>
                <span />
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {materialLines.map((line) => {
                const material = materialOf(line);
                const cost = costOf(line);
                return (
                  <li key={line.key} className="flex flex-col gap-1">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_5rem_6rem_2rem] sm:items-center">
                      <div className="col-span-2 sm:col-span-1">
                        <MaterialPicker
                          materials={pickable}
                          current={line.savedMaterial}
                          value={line.materialId}
                          onChange={(picked) =>
                            setLine(line.key, {
                              materialId: picked.id,
                              savedMaterial: picked,
                            })
                          }
                          onAddNew={() => setNewMaterialFor(line.key)}
                          invalid={
                            Boolean(errors[line.key]) && !line.materialId
                          }
                          disabled={isPending}
                        />
                      </div>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.001"
                        placeholder="0"
                        aria-label="Batch uses"
                        value={line.quantity}
                        onChange={(event) =>
                          setLine(line.key, { quantity: event.target.value })
                        }
                        endAdornment={
                          material ? (
                            <span className="text-xs text-stone-400">
                              {UNIT_SHORT[material.unit]}
                            </span>
                          ) : undefined
                        }
                        disabled={isPending}
                      />
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="0.5"
                        placeholder="0"
                        aria-label="Wastage"
                        value={line.wastagePercent}
                        onChange={(event) =>
                          setLine(line.key, {
                            wastagePercent: event.target.value,
                          })
                        }
                        endAdornment={
                          <span className="text-xs text-stone-400">%</span>
                        }
                        disabled={isPending}
                      />
                      <SimpleTooltip
                        label={`${formatPrice(roundMoney(perPiece(cost)))} a piece`}
                      >
                        <span className={cn(numberClass, 'text-sm')}>
                          {formatPrice(roundMoney(cost))}
                        </span>
                      </SimpleTooltip>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLine(line.key)}
                        disabled={isPending}
                        aria-label="Remove line"
                        className="justify-self-end text-stone-400 hover:text-red-600"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    {errors[line.key] && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {errors[line.key]}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {draft.lines.length < COSTING_LIMITS.SHEET_LINES_MAX && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addLine('MATERIAL')}
                disabled={isPending}
                startAdornment={<Plus />}
                className="w-fit"
              >
                Add material
              </Button>
            )}
          </section>

          <section className="flex flex-col gap-2 border-t border-stone-100 pt-4 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
                Making, packing & sending
              </h3>
              <span className="text-xs text-stone-500 tabular-nums dark:text-stone-400">
                {formatPrice(
                  roundMoney(totals.unit.total - totals.unit.MATERIAL),
                )}{' '}
                a piece
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {otherLines.map((line) => {
                const cost = costOf(line);
                return (
                  <li key={line.key} className="flex flex-col gap-1">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_8rem_6rem_2rem] sm:items-center">
                      <Select
                        value={line.type}
                        onValueChange={(type) =>
                          setLine(line.key, { type: type as CostLineType })
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger aria-label="Kind of cost">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COST_LINE_TYPES.filter(
                            (type) => type.value !== 'MATERIAL',
                          ).map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={
                          COST_LINE_TYPES.find(
                            (type) => type.value === line.type,
                          )?.hint
                        }
                        aria-label="What it is"
                        maxLength={COSTING_LIMITS.LINE_LABEL_MAX}
                        value={line.label}
                        onChange={(event) =>
                          setLine(line.key, { label: event.target.value })
                        }
                        disabled={isPending}
                      />
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="Per batch"
                        aria-label="Costs the batch"
                        startAdornment={
                          <span className="text-sm text-stone-400">₹</span>
                        }
                        value={line.amount}
                        onChange={(event) =>
                          setLine(line.key, { amount: event.target.value })
                        }
                        disabled={isPending}
                      />
                      <span
                        className={cn(numberClass, 'text-sm text-stone-500')}
                      >
                        {formatPrice(roundMoney(perPiece(cost)))}
                        <span className="block text-[10px] text-stone-400">
                          a piece
                        </span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLine(line.key)}
                        disabled={isPending}
                        aria-label="Remove line"
                        className="justify-self-end text-stone-400 hover:text-red-600"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    {errors[line.key] && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {errors[line.key]}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {draft.lines.length < COSTING_LIMITS.SHEET_LINES_MAX && (
              <div className="flex flex-wrap gap-2">
                {COST_LINE_TYPES.filter(
                  (type) => type.value !== 'MATERIAL',
                ).map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => addLine(type.value)}
                    disabled={isPending}
                    startAdornment={<Plus />}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            )}
          </section>

          <label className="flex flex-col gap-1.5 border-t border-stone-100 pt-4 text-xs font-medium text-stone-600 dark:border-stone-800 dark:text-stone-400">
            Notes
            <Textarea
              rows={2}
              maxLength={COSTING_LIMITS.SHEET_NOTES_MAX}
              placeholder="How it's made, who makes it, when prices were last checked"
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
              disabled={isPending}
            />
          </label>

          <div className="flex flex-col gap-3 rounded-lg bg-stone-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:bg-stone-900/60">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              A batch costs{' '}
              <span className="font-medium text-stone-900 tabular-nums dark:text-stone-50">
                {formatPrice(roundMoney(totals.batch.total))}
              </span>
              {' · '}one piece{' '}
              <span className="text-base font-semibold text-stone-900 tabular-nums dark:text-stone-50">
                {formatPrice(roundMoney(totals.unit.total))}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {sheet && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isPending}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 />
                  Delete sheet
                </Button>
              )}
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft(saved);
                    setErrors({});
                  }}
                  disabled={isPending}
                >
                  <RotateCcw />
                  Discard changes
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={!isDirty || isPending}
                startAdornment={
                  saveSheet.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : undefined
                }
              >
                Save cost sheet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {children && (
        <div className="flex flex-col gap-6">
          {children(totals.unit, isDirty)}
        </div>
      )}

      <MaterialDialog
        open={newMaterialFor !== null}
        onOpenChange={(open) => !open && setNewMaterialFor(null)}
        categories={materials.data?.categories}
        onCreated={(material) => {
          if (newMaterialFor) {
            setLine(newMaterialFor, {
              materialId: material.id,
              savedMaterial: material,
            });
          }
          setNewMaterialFor(null);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this cost sheet?"
        description={
          target.variantId
            ? 'The variant goes back to costing what its product’s sheet says.'
            : 'It goes back to having no cost — its profit can’t be worked out until it has a sheet again.'
        }
        confirmLabel="Delete sheet"
        variant="destructive"
        isPending={deleteSheet.isPending}
        onConfirm={() =>
          sheet &&
          deleteSheet.mutate(sheet.id, {
            onSuccess: () => {
              const empty = toDraft(null);
              setSaved(empty);
              setDraft(empty);
              setConfirmDelete(false);
            },
          })
        }
      />
    </div>
  );
};

export default CostSheetEditor;
