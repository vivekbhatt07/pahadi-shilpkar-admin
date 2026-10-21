import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import Callout from '@/components/custom/Callout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { applyApiFieldErrors, pickChangedFields } from '@/helpers/form';
import { useCreateMaterial, useUpdateMaterial } from '@/hooks/costing';
import type { MaterialUnit, RawMaterial } from '@/types/api';

import { COSTING_LIMITS, MATERIAL_UNITS, UNIT_SHORT } from '../constants';

const UNIT_COST_REGEX = /^\d+(?:\.\d{1,4})?$/;

const materialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(
      COSTING_LIMITS.MATERIAL_NAME_MAX,
      'Name must be 80 characters or fewer',
    ),
  category: z
    .string()
    .trim()
    .max(
      COSTING_LIMITS.MATERIAL_CATEGORY_MAX,
      'Category must be 40 characters or fewer',
    ),
  unit: z.enum(MATERIAL_UNITS.map((unit) => unit.value) as [MaterialUnit]),
  unitCost: z
    .number({ error: 'Enter what one unit costs' })
    .refine(
      (cost) =>
        cost >= 0 &&
        cost <= COSTING_LIMITS.UNIT_COST_MAX &&
        UNIT_COST_REGEX.test(String(cost)),
      'Enter an amount, with at most 4 decimals',
    ),
  supplier: z
    .string()
    .trim()
    .max(
      COSTING_LIMITS.MATERIAL_SUPPLIER_MAX,
      'Supplier must be 80 characters or fewer',
    ),
  notes: z
    .string()
    .trim()
    .max(
      COSTING_LIMITS.MATERIAL_NOTES_MAX,
      'Notes must be 500 characters or fewer',
    ),
  isActive: z.boolean(),
});

type TMaterialFormData = z.infer<typeof materialSchema>;

const toFormData = (material?: RawMaterial | null): TMaterialFormData => ({
  name: material?.name ?? '',
  category: material?.category ?? '',
  unit: material?.unit ?? 'PIECE',
  unitCost: material?.unitCost ?? Number.NaN,
  supplier: material?.supplier ?? '',
  notes: material?.notes ?? '',
  isActive: material?.isActive ?? true,
});

type TMaterialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits; otherwise it adds one. */
  material?: RawMaterial | null;
  /** Categories in use, offered as suggestions. */
  categories?: string[];
  /** Called with the new material after adding one. */
  onCreated?: (material: RawMaterial) => void;
};

const MaterialDialog = ({
  open,
  onOpenChange,
  material,
  categories = [],
  onCreated,
}: TMaterialDialogProps) => {
  const isEdit = Boolean(material);
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const isPending = createMaterial.isPending || updateMaterial.isPending;

  const form = useForm<TMaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: toFormData(material),
  });

  useEffect(() => {
    if (open) form.reset(toFormData(material));
  }, [open, material, form]);

  const unit = useWatch({ control: form.control, name: 'unit' });
  const unitChanged = isEdit && material && unit !== material.unit;

  const handleSubmit = (data: TMaterialFormData) => {
    const onError = (error: unknown) => applyApiFieldErrors(form, error);

    if (isEdit && material) {
      const changed = pickChangedFields(toFormData(material), data);
      if (Object.keys(changed).length === 0) {
        onOpenChange(false);
        return;
      }
      updateMaterial.mutate(
        {
          id: material.id,
          payload: {
            ...(changed.name !== undefined && { name: changed.name }),
            ...(changed.category !== undefined && {
              category: changed.category || null,
            }),
            ...(changed.unit !== undefined && { unit: changed.unit }),
            ...(changed.unitCost !== undefined && {
              unitCost: changed.unitCost,
            }),
            ...(changed.supplier !== undefined && {
              supplier: changed.supplier || null,
            }),
            ...(changed.notes !== undefined && {
              notes: changed.notes || null,
            }),
            ...(changed.isActive !== undefined && {
              isActive: changed.isActive,
            }),
          },
        },
        { onSuccess: () => onOpenChange(false), onError },
      );
      return;
    }

    createMaterial.mutate(
      {
        name: data.name,
        unit: data.unit,
        unitCost: data.unitCost,
        ...(data.category && { category: data.category }),
        ...(data.supplier && { supplier: data.supplier }),
        ...(data.notes && { notes: data.notes }),
        isActive: data.isActive,
      },
      {
        onSuccess: (response) => {
          onOpenChange(false);
          if (response.data) onCreated?.(response.data);
        },
        onError,
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isPending && onOpenChange(next)}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit material' : 'Add a raw material'}
          </DialogTitle>
          <DialogDescription>
            Something you buy to make your pieces — a steel plate, a bottle of
            paint, a metre of lace. Cost sheets are priced from what one unit
            costs, so a new price reaches every product using it.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(event) => {
              // Opened from the cost sheet editor, which isn't a form — but
              // keep a parent form, if any, from submitting too
              event.stopPropagation();
              form.handleSubmit(handleSubmit)(event);
            }}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Name</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Steel thali plate, 12 inch"
                      maxLength={COSTING_LIMITS.MATERIAL_NAME_MAX}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Counted in</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAL_UNITS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} ({option.short})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Cost per {UNIT_SHORT[unit]}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.0001"
                        placeholder="0.00"
                        disabled={isPending}
                        startAdornment={
                          <span className="text-sm text-stone-400">₹</span>
                        }
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={Number.isNaN(field.value) ? '' : field.value}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ''
                              ? Number.NaN
                              : event.target.valueAsNumber,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Recording a purchase updates it for you.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {unitChanged && (
              <Callout variant="warning" size="sm">
                Cost sheets keep their quantities as they are — 500 of the old
                unit becomes 500 {UNIT_SHORT[unit]}. Check the products using
                it.
              </Callout>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Category</FormLabel>
                    <FormControl>
                      <Input
                        list="material-categories"
                        placeholder="Base, Paint, Decoration…"
                        maxLength={COSTING_LIMITS.MATERIAL_CATEGORY_MAX}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <datalist id="material-categories">
                      {[
                        ...new Set([
                          ...categories,
                          'Base',
                          'Paint',
                          'Decoration',
                          'Packaging',
                        ]),
                      ].map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Supplier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sadar Bazaar, Haldwani"
                        maxLength={COSTING_LIMITS.MATERIAL_SUPPLIER_MAX}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      maxLength={COSTING_LIMITS.MATERIAL_NOTES_MAX}
                      placeholder="Minimum order 50 · ask for the matte finish"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-stone-200 px-3 py-2.5 dark:border-stone-800">
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                          In use
                        </span>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          Off, it isn't offered for new cost lines — the sheets
                          already using it keep it.
                        </span>
                      </span>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                    </label>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
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
                {isEdit ? 'Save' : 'Add material'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialDialog;
