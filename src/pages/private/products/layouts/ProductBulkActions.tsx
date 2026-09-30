import {
  Boxes,
  ChevronDown,
  Eye,
  EyeOff,
  FolderInput,
  Star,
  StarOff,
  TrendingUp,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BulkProductChanges } from '@/types/api';

import { AVAILABILITY_OPTIONS } from '../constants';

type TProductBulkActionsProps = {
  count: number;
  isPending?: boolean;
  /** Changes that need no confirmation. */
  onApply: (changes: BulkProductChanges) => void;
  /** Hides products from the storefront — the page confirms first. */
  onDeactivate: () => void;
  /** Opens the category picker. */
  onMove: () => void;
  onClear: () => void;
};

/** Toolbar for the products selected on the current page. */
const ProductBulkActions = ({
  count,
  isPending,
  onApply,
  onDeactivate,
  onMove,
  onClear,
}: TProductBulkActionsProps) => (
  <div
    role="toolbar"
    aria-label="Bulk actions"
    className="flex animate-in flex-wrap items-center gap-2 rounded-xl border border-accent-200 bg-accent-50/70 px-3 py-2 duration-150 fade-in-0 slide-in-from-top-1 dark:border-accent-900/60 dark:bg-accent-950/30"
  >
    <span className="mr-1 text-sm font-medium text-accent-900 tabular-nums dark:text-accent-100">
      {count} selected
    </span>

    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => onApply({ isActive: true })}
    >
      <Eye />
      Activate
    </Button>
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={onDeactivate}
    >
      <EyeOff />
      Deactivate
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={isPending}>
          More actions
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuItem onSelect={() => onApply({ isFeatured: true })}>
          <Star />
          Feature
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onApply({ isFeatured: false })}>
          <StarOff />
          Remove from featured
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onApply({ isBestseller: true })}>
          <TrendingUp />
          Mark as bestseller
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onApply({ isBestseller: false })}>
          <TrendingUp className="opacity-40" />
          Remove bestseller
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Boxes />
            Set availability
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            {AVAILABILITY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => onApply({ availability: option.value })}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal tracking-normal normal-case">
              In stock / Made to order emails shoppers waiting on these.
            </DropdownMenuLabel>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={onMove}>
          <FolderInput />
          Move to category…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Button
      size="sm"
      variant="ghost"
      onClick={onClear}
      disabled={isPending}
      className="ml-auto"
    >
      <X />
      Clear
    </Button>
  </div>
);

export default ProductBulkActions;
