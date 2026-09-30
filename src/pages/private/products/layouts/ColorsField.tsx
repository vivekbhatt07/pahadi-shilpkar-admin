import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ban, GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';

import ColorSwatch from '@/components/custom/ColorSwatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  DEFAULT_SWATCH,
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
} from '../constants';
import type { TProductFormData } from '../types';

const { COLORS } = PRODUCT_FORM_FIELD_NAMES;

type TSwatchPickerProps = {
  value: string | null;
  onChange: (hex: string | null) => void;
  colorName: string;
  disabled?: boolean;
};

/**
 * The swatch opens the native colour picker; the ⊘ toggle switches to "no
 * swatch" for shades one flat colour can't show, and back to the last pick.
 */
const SwatchPicker = ({
  value,
  onChange,
  colorName,
  disabled,
}: TSwatchPickerProps) => {
  const [lastHex, setLastHex] = useState(value ?? DEFAULT_SWATCH);
  const hasSwatch = value !== null;
  const label = colorName.trim() || 'this colour';

  return (
    <>
      <SimpleTooltip label={hasSwatch ? value : 'Pick a swatch'}>
        <label
          className={cn(
            'relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white transition-colors hover:border-stone-300 md:size-10 dark:border-stone-700 dark:bg-stone-900/60 dark:hover:border-stone-600',
            'focus-within:border-accent-500 focus-within:ring-4 focus-within:ring-accent-500/15',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <input
            type="color"
            value={value ?? lastHex}
            // Opening the picker on a row without a swatch gives it one, even
            // if the shade it starts on is kept (which fires no change).
            onClick={() => !hasSwatch && onChange(lastHex)}
            onChange={(event) => {
              setLastHex(event.target.value);
              onChange(event.target.value);
            }}
            disabled={disabled}
            aria-label={`Swatch for ${label}`}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <ColorSwatch hex={value} className="pointer-events-none size-5" />
        </label>
      </SimpleTooltip>
      <SimpleTooltip
        label={
          hasSwatch
            ? 'No swatch — for wood grain or multicolour'
            : 'Use a swatch'
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(hasSwatch ? null : lastHex)}
          disabled={disabled}
          aria-pressed={!hasSwatch}
          aria-label={`No swatch for ${label}`}
          className={cn(
            'text-stone-400',
            !hasSwatch &&
              'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200',
          )}
        >
          <Ban />
        </Button>
      </SimpleTooltip>
    </>
  );
};

type TColorRowProps = {
  id: string;
  index: number;
  canReorder: boolean;
  disabled?: boolean;
  onRemove: () => void;
};

const ColorRow = ({
  id,
  index,
  canReorder,
  disabled,
  onRemove,
}: TColorRowProps) => {
  const { control, register } = useFormContext<TProductFormData>();
  const colorName = useWatch({ control, name: `${COLORS}.${index}.name` });
  // useFormState (not formState from context) so the React Compiler sees
  // fresh errors after a submit.
  const errors = useFormState({ control, name: `${COLORS}.${index}` }).errors
    .colors?.[index];
  const nameError = errors?.name?.message;
  const rowError = nameError ?? errors?.hex?.message;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !canReorder || disabled });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex flex-col gap-1 rounded-lg bg-white dark:bg-stone-900',
        isDragging &&
          'relative z-10 shadow-xl ring-2 ring-accent-500/40 dark:bg-stone-800',
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={!canReorder || disabled}
          aria-label={`Reorder ${colorName.trim() || 'colour'}`}
          className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-0.5 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:outline-none active:cursor-grabbing disabled:cursor-default disabled:opacity-40 dark:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
        >
          <GripVertical className="size-4" />
        </button>

        <Controller
          control={control}
          name={`${COLORS}.${index}.hex`}
          render={({ field }) => (
            <SwatchPicker
              value={field.value}
              onChange={field.onChange}
              colorName={colorName}
              disabled={disabled}
            />
          )}
        />

        <Input
          placeholder="Geru red"
          maxLength={PRODUCT_LIMITS.COLOR_NAME_MAX}
          disabled={disabled}
          aria-invalid={Boolean(nameError)}
          aria-label={`Colour ${index + 1} name`}
          {...register(`${COLORS}.${index}.name`)}
        />

        <SimpleTooltip label="Remove">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remove ${colorName.trim() || 'colour'}`}
            className="text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
          >
            <Trash2 />
          </Button>
        </SimpleTooltip>
      </div>
      {rowError && (
        <p className="pl-7 text-xs font-medium text-red-600 dark:text-red-400">
          {rowError}
        </p>
      )}
    </li>
  );
};

type TColorsFieldProps = { disabled?: boolean };

/**
 * The colours the piece is made in, shown to shoppers as swatches in this
 * order. Drag a row by its handle, or focus the handle and use Space + arrow
 * keys. The whole list is sent whenever it changes.
 */
const ColorsField = ({ disabled }: TColorsFieldProps) => {
  const { control } = useFormContext<TProductFormData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: COLORS,
  });
  const errors = useFormState({ control, name: COLORS }).errors.colors;
  const rootError = errors?.root?.message ?? errors?.message;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    move(oldIndex, newIndex);
  };

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 ? (
        <p className="text-xs text-stone-400 dark:text-stone-500">
          No colours yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((field) => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <ColorRow
                  key={field.id}
                  id={field.id}
                  index={index}
                  canReorder={fields.length > 1}
                  disabled={disabled}
                  onRemove={() => remove(index)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {rootError && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {rootError}
        </p>
      )}

      {fields.length < PRODUCT_LIMITS.COLORS_MAX && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append(
              { name: '', hex: null },
              { focusName: `${COLORS}.${fields.length}.name` },
            )
          }
          disabled={disabled}
          startAdornment={<Plus />}
          className="w-fit"
        >
          Add colour
        </Button>
      )}
    </div>
  );
};

export default ColorsField;
