import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCategoryTree } from '@/hooks/categories';
import { cn } from '@/lib/utils';
import type { CategoryTreeNode } from '@/types/api';

type TFlatNode = {
  id: string;
  name: string;
  depth: number;
  isActive: boolean;
  path: string;
};

/** Depth-first flatten. Skips `excludeId` and its whole subtree (a category
 * cannot be moved under itself or one of its own descendants). */
const flatten = (
  nodes: CategoryTreeNode[],
  depth: number,
  excludeId: string | undefined,
  parentPath: string,
  out: TFlatNode[],
) => {
  for (const node of nodes) {
    if (excludeId && node.id === excludeId) continue;
    const path = parentPath ? `${parentPath} / ${node.name}` : node.name;
    out.push({
      id: node.id,
      name: node.name,
      depth,
      isActive: node.isActive,
      path,
    });
    if (node.children.length > 0) {
      flatten(node.children, depth + 1, excludeId, path, out);
    }
  }
};

type TCategoryTreePickerProps = {
  value: string | null;
  onChange: (id: string | null) => void;
  /** Exclude this category and its descendants (e.g. its own subtree while moving it). */
  excludeId?: string;
  /** Show a "no parent" option that sets the value to null. */
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
};

/** Searchable dropdown over the full category tree (any depth). */
const CategoryTreePicker = ({
  value,
  onChange,
  excludeId,
  allowNone = false,
  noneLabel = 'No parent (top level)',
  placeholder = 'Select a category…',
  disabled,
  id,
  ...ariaProps
}: TCategoryTreePickerProps) => {
  const { data: tree = [], isPending } = useCategoryTree({
    includeInactive: true,
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const flat = useMemo(() => {
    const out: TFlatNode[] = [];
    flatten(tree, 0, excludeId, '', out);
    return out;
  }, [tree, excludeId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return flat;
    return flat.filter((node) => node.path.toLowerCase().includes(query));
  }, [flat, search]);

  const selected = flat.find((node) => node.id === value);

  const handleSelect = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  const triggerLabel =
    value === null
      ? allowNone
        ? noneLabel
        : placeholder
      : (selected?.path ?? placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isPending}
          className="w-full justify-between font-normal"
          {...ariaProps}
        >
          <span
            className={cn(
              'truncate text-left',
              value === null && !allowNone && 'text-stone-400',
            )}
          >
            {triggerLabel}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-stone-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <div className="border-b border-stone-200 p-2 dark:border-stone-700">
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories…"
            startAdornment={<Search className="size-4 text-stone-400" />}
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {allowNone && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                'hover:bg-stone-100 dark:hover:bg-stone-800',
                value === null &&
                  'font-medium text-accent-700 dark:text-accent-400',
              )}
            >
              <Check
                className={cn(
                  'size-3.5 shrink-0',
                  value !== null && 'invisible',
                )}
              />
              {noneLabel}
            </button>
          )}
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-stone-400">
              No categories found
            </p>
          ) : (
            filtered.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSelect(node.id)}
                style={{ paddingLeft: `${8 + node.depth * 16}px` }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm',
                  'hover:bg-stone-100 dark:hover:bg-stone-800',
                  node.id === value &&
                    'font-medium text-accent-700 dark:text-accent-400',
                )}
              >
                <Check
                  className={cn(
                    'size-3.5 shrink-0',
                    node.id !== value && 'invisible',
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{node.name}</span>
                {!node.isActive && (
                  <Badge variant="secondary" className="shrink-0">
                    Inactive
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryTreePicker;
