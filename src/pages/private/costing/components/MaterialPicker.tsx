import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CostLine, RawMaterial } from '@/types/api';

import { formatUnitCost } from '../helpers';

export type TPickable = Pick<
  RawMaterial,
  'id' | 'name' | 'unit' | 'unitCost' | 'isActive'
> & { category?: string | null };

type TMaterialPickerProps = {
  materials: TPickable[];
  /** The line's material as saved — kept pickable once switched off. */
  current: CostLine['material'];
  value: string | null;
  onChange: (material: TPickable) => void;
  onAddNew?: () => void;
  disabled?: boolean;
  invalid?: boolean;
};

/** A searchable list of raw materials, grouped by category, with their prices. */
const MaterialPicker = ({
  materials,
  current,
  value,
  onChange,
  onAddNew,
  disabled,
  invalid,
}: TMaterialPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const all: TPickable[] =
    current && !materials.some((material) => material.id === current.id)
      ? [...materials, current]
      : materials;
  const selected = all.find((material) => material.id === value);
  const needle = search.trim().toLowerCase();
  const matching = all.filter(
    (material) =>
      (material.isActive || material.id === value) &&
      (!needle ||
        material.name.toLowerCase().includes(needle) ||
        material.category?.toLowerCase().includes(needle)),
  );
  const groups = [
    ...new Set(matching.map((material) => material.category ?? '')),
  ].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          aria-label="Raw material"
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-stone-400',
            invalid && 'border-red-400 dark:border-red-500',
          )}
        >
          <span className="truncate">
            {selected ? selected.name : 'Pick a material'}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="border-b border-stone-100 p-2 dark:border-stone-800">
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search materials…"
            aria-label="Search materials"
            startAdornment={<Search className="size-4 text-stone-400" />}
          />
        </div>
        <div role="listbox" className="max-h-64 overflow-y-auto p-1">
          {matching.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-stone-400">
              No material matches.
            </p>
          )}
          {groups.map((group) => (
            <div key={group || 'none'}>
              {groups.length > 1 && (
                <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                  {group || 'Uncategorised'}
                </p>
              )}
              {matching
                .filter((material) => (material.category ?? '') === group)
                .map((material) => (
                  <button
                    key={material.id}
                    type="button"
                    role="option"
                    aria-selected={material.id === value}
                    onClick={() => {
                      onChange(material);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-stone-100 focus-visible:bg-stone-100 dark:hover:bg-stone-800 dark:focus-visible:bg-stone-800"
                  >
                    <Check
                      className={cn(
                        'size-3.5 shrink-0',
                        material.id === value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {material.name}
                      {!material.isActive && (
                        <span className="text-stone-400"> (switched off)</span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-stone-500 tabular-nums">
                      {formatUnitCost(material.unitCost, material.unit)}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
        {onAddNew && (
          <div className="border-t border-stone-100 p-1 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddNew();
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-accent-700 outline-none hover:bg-accent-50 dark:text-accent-400 dark:hover:bg-accent-950/40"
            >
              <Plus className="size-3.5" />
              Add a new material
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default MaterialPicker;
