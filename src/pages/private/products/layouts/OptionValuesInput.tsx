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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';

import ColorSwatch from '@/components/custom/ColorSwatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { DEFAULT_SWATCH, PRODUCT_LIMITS } from '../constants';
import { sameText } from '../variants';

type TOptionValuesInputProps = {
  /** What the values are of — "Design" — for labels. */
  optionName: string;
  values: string[];
  /** Value → colour while the option shows swatches; `null` = it doesn't. */
  swatches?: Record<string, string> | null;
  onAdd: (value: string) => void;
  onRename: (from: string, to: string) => void;
  onRemove: (value: string) => void;
  onMove: (from: number, to: number) => void;
  onSwatch?: (value: string, hex: string) => void;
  disabled?: boolean;
};

/**
 * A value's colour — opens the native colour picker. Opening it on a value
 * without one gives it the shade it starts on, even if that's kept (a kept
 * shade fires no change).
 */
const ValueSwatch = ({
  value,
  hex,
  onChange,
  disabled,
}: {
  value: string;
  hex: string | undefined;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) => (
  <SimpleTooltip label={hex ?? `Pick a colour for ${value}`}>
    <label
      className={cn(
        'relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full',
        'focus-within:ring-2 focus-within:ring-accent-500/40',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <input
        type="color"
        value={hex ?? DEFAULT_SWATCH}
        onClick={() => !hex && onChange(DEFAULT_SWATCH)}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label={`Colour of ${value}`}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
      <ColorSwatch
        hex={hex ?? null}
        className={cn('pointer-events-none size-4', !hex && 'border-red-400')}
      />
    </label>
  </SimpleTooltip>
);

type TValueChipProps = {
  value: string;
  label: string;
  canReorder: boolean;
  editing: { from: string; to: string } | null;
  swatches?: Record<string, string> | null;
  disabled?: boolean;
  onEdit: (editing: { from: string; to: string } | null) => void;
  onCommit: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onSwatch?: (hex: string) => void;
};

const ValueChip = ({
  value,
  label,
  canReorder,
  editing,
  swatches,
  disabled,
  onEdit,
  onCommit,
  onCancel,
  onRemove,
  onSwatch,
}: TValueChipProps) => {
  const isEditing = editing?.from === value;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value,
    disabled: disabled || !canReorder || isEditing,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (isEditing) {
    return (
      <span ref={setNodeRef} style={style}>
        <Input
          autoFocus
          value={editing.to}
          maxLength={PRODUCT_LIMITS.VARIANT_OPTION_VALUE_MAX}
          aria-label={`Rename ${value}`}
          onChange={(event) => onEdit({ from: value, to: event.target.value })}
          onBlur={onCommit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onCommit();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          }}
          className="h-7 w-40 text-sm md:h-7"
        />
      </span>
    );
  }

  return (
    <span
      ref={setNodeRef}
      style={style}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-md bg-stone-100 text-sm text-stone-800 dark:bg-stone-800 dark:text-stone-100',
        canReorder ? 'pl-0.5' : 'pl-2',
        isDragging &&
          'relative z-10 shadow-lg ring-2 ring-accent-500/40 dark:bg-stone-700',
      )}
    >
      {canReorder && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label={`Reorder ${value}`}
          className="flex h-6 cursor-grab touch-none items-center rounded-sm text-stone-400 outline-none hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-accent-500/40 active:cursor-grabbing disabled:cursor-default dark:text-stone-500 dark:hover:text-stone-300"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      {swatches && onSwatch && (
        <ValueSwatch
          value={value}
          hex={swatches[value]}
          onChange={onSwatch}
          disabled={disabled}
        />
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onEdit({ from: value, to: value })}
        title="Click to rename"
        className="cursor-text rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
      >
        {value}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove ${value} from ${label}`}
        className="flex size-7 cursor-pointer items-center justify-center rounded-r-md text-stone-400 transition-colors outline-none hover:bg-stone-200 hover:text-stone-700 focus-visible:ring-2 focus-visible:ring-accent-500/40 dark:hover:bg-stone-700 dark:hover:text-stone-200"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
};

/**
 * Values as chips. Type one and press Enter — or several at once, "Peacock,
 * Lotus, Kalash". Click a chip to rename it: its variants keep their ids, so
 * a typo can be fixed without breaking a combo that sells one. Drag a chip by
 * its handle (or focus the handle and use Space + arrow keys) to change the
 * order shoppers see the values in. While the option shows swatches, each
 * chip has its colour.
 */
const OptionValuesInput = ({
  optionName,
  values,
  swatches,
  onAdd,
  onRename,
  onRemove,
  onMove,
  onSwatch,
  disabled,
}: TOptionValuesInputProps) => {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ from: string; to: string } | null>(
    null,
  );
  const label = optionName.trim() || 'this option';
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Why `value` can't be added (or a chip renamed to it), or null
  const problemWith = (value: string, except?: string) => {
    if (value.length > PRODUCT_LIMITS.VARIANT_OPTION_VALUE_MAX) {
      return `Values must be ${PRODUCT_LIMITS.VARIANT_OPTION_VALUE_MAX} characters or fewer`;
    }
    if (values.some((v) => v !== except && sameText(v, value))) {
      return `${value} is already listed`;
    }
    return null;
  };

  const addDraft = () => {
    const entries = draft
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (entries.length === 0) return;

    const added: string[] = [];
    for (const entry of entries) {
      if (
        values.length + added.length >=
        PRODUCT_LIMITS.VARIANT_OPTION_VALUES_MAX
      ) {
        setError(
          `An option can have up to ${PRODUCT_LIMITS.VARIANT_OPTION_VALUES_MAX} values`,
        );
        break;
      }
      const problem =
        problemWith(entry) ??
        (added.some((v) => sameText(v, entry))
          ? `${entry} is already listed`
          : null);
      if (problem) {
        setError(problem);
        continue;
      }
      added.push(entry);
      onAdd(entry);
    }
    if (added.length === entries.length) setError(null);
    setDraft('');
  };

  const commitRename = () => {
    if (!editing) return;
    const to = editing.to.trim();
    if (!to || to === editing.from) {
      setEditing(null);
      return;
    }
    const problem = problemWith(to, editing.from);
    if (problem) {
      setError(problem);
      return;
    }
    onRename(editing.from, to);
    setEditing(null);
    setError(null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = values.indexOf(String(active.id));
    const to = values.indexOf(String(over.id));
    if (from !== -1 && to !== -1) onMove(from, to);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={values} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap items-center gap-1.5">
            {values.map((value) => (
              <ValueChip
                key={value}
                value={value}
                label={label}
                canReorder={values.length > 1}
                editing={editing}
                swatches={swatches}
                disabled={disabled}
                onEdit={setEditing}
                onCommit={commitRename}
                onCancel={() => {
                  setEditing(null);
                  setError(null);
                }}
                onRemove={() => onRemove(value)}
                onSwatch={onSwatch && ((hex) => onSwatch(value, hex))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addDraft();
            }
          }}
          placeholder={
            values.length === 0
              ? 'Type values and press Enter — Peacock, Lotus, Kalash'
              : 'Add another value…'
          }
          aria-label={`Add a value to ${label}`}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          className="h-8 md:h-9"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addDraft}
          disabled={disabled || !draft.trim()}
        >
          <Plus />
          Add
        </Button>
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default OptionValuesInput;
