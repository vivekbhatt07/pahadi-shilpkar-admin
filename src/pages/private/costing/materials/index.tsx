import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  MoreHorizontal,
  PackageOpen,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/helpers/format';
import { useDeleteMaterial, useMaterials } from '@/hooks/costing';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { MaterialSort, RawMaterialListItem } from '@/types/api';

import MaterialDialog from '../components/MaterialDialog';
import PurchaseDialog from '../components/PurchaseDialog';
import { COSTING_LIST_LIMIT, MATERIAL_SORTS, UNIT_LABELS } from '../constants';
import { formatUnitCost } from '../helpers';
import PriceTrend from './PriceTrend';

const PARAMS = {
  CATEGORY: 'category',
  SEARCH: 'search',
  SORT: 'sort',
  ARCHIVED: 'archived',
  PAGE: 'page',
} as const;

const ALL = 'ALL';

/**
 * Everything bought to make the pieces, with what one unit costs now and
 * how its price last moved. Recording a purchase updates the cost — and
 * with it every product made from the material.
 */
const MaterialsPage = () => {
  useDocumentTitle('Raw materials');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<RawMaterialListItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [buying, setBuying] = useState<RawMaterialListItem | null>(null);
  const [deleting, setDeleting] = useState<RawMaterialListItem | null>(null);
  const deleteMaterial = useDeleteMaterial();

  const category = searchParams.get(PARAMS.CATEGORY) ?? undefined;
  const sort: MaterialSort =
    MATERIAL_SORTS.find(
      (option) => option.value === searchParams.get(PARAMS.SORT),
    )?.value ?? 'name_asc';
  const showArchived = searchParams.get(PARAMS.ARCHIVED) === '1';
  const page = Math.max(1, Number(searchParams.get(PARAMS.PAGE)) || 1);
  const search = searchParams.get(PARAMS.SEARCH) ?? '';
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  const materials = useMaterials({
    category,
    sort,
    search: debouncedSearch || undefined,
    isActive: showArchived ? undefined : true,
    page,
    limit: COSTING_LIST_LIMIT,
  });
  const data = materials.data;
  const items = data?.items ?? [];
  const isFiltered = Boolean(category || search.trim());

  const setFilter = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === '') next.delete(key);
    else next.set(key, value);
    next.delete(PARAMS.PAGE);
    setSearchParams(next, { replace: true });
  };

  const openEditor = (material: RawMaterialListItem | null) => {
    setEditing(material);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Raw materials"
        count={data?.total}
        description="Plates, paint, lace, boxes — what you buy, in the unit you use it in, at what it costs now."
        actions={
          <Button
            size="sm"
            onClick={() => openEditor(null)}
            startAdornment={<Plus />}
          >
            Add material
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setFilter(PARAMS.SEARCH, event.target.value)}
            onClear={() => setFilter(PARAMS.SEARCH, undefined)}
            placeholder="Search by name, category or supplier…"
            aria-label="Search materials"
            startAdornment={<Search className="size-4 text-stone-400" />}
            className="sm:w-72"
          />
          <Select
            value={category ?? ALL}
            onValueChange={(value) =>
              setFilter(PARAMS.CATEGORY, value === ALL ? undefined : value)
            }
          >
            <SelectTrigger aria-label="Category" className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {(data?.categories ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) =>
                setFilter(
                  PARAMS.ARCHIVED,
                  event.target.checked ? '1' : undefined,
                )
              }
              className="size-4 accent-accent-600"
            />
            Show switched-off ones
          </label>
          <Select
            value={sort}
            onValueChange={(value) =>
              setFilter(PARAMS.SORT, value === 'name_asc' ? undefined : value)
            }
          >
            <SelectTrigger aria-label="Sort" className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_SORTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {materials.isPending ? (
        <ListSkeleton rows={6} media="none" trailing={3} />
      ) : items.length > 0 ? (
        <div
          aria-busy={materials.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            materials.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
            <Table>
              <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
                <TableRow>
                  <TableHead className="min-w-48">Material</TableHead>
                  <TableHead className="text-right">Costs now</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Last bought
                  </TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Used in
                  </TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((material) => (
                  <TableRow
                    key={material.id}
                    onClick={() =>
                      navigate(ROUTES.PRIVATE.COSTING.MATERIAL(material.id))
                    }
                    className={cn(
                      'cursor-pointer',
                      !material.isActive && 'opacity-60',
                    )}
                  >
                    <TableCell>
                      <Link
                        to={ROUTES.PRIVATE.COSTING.MATERIAL(material.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="block min-w-0"
                      >
                        <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                          {material.name}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                          {material.category && (
                            <Badge variant="outline">{material.category}</Badge>
                          )}
                          {UNIT_LABELS[material.unit]}
                          {material.supplier && ` · ${material.supplier}`}
                          {!material.isActive && ' · switched off'}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="block text-sm font-medium tabular-nums">
                        {formatUnitCost(material.unitCost, material.unit)}
                      </span>
                      <PriceTrend change={material.priceChangePercent} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-stone-600 md:table-cell dark:text-stone-300">
                      {material.lastPurchase ? (
                        <>
                          {formatDate(material.lastPurchase.purchasedAt)}
                          <span className="block text-xs text-stone-400 tabular-nums">
                            at{' '}
                            {formatUnitCost(
                              material.lastPurchase.unitCost,
                              material.unit,
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-stone-400">Never recorded</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-right text-sm tabular-nums sm:table-cell">
                      {material.usageCount === 0 ? (
                        <span className="text-stone-400">—</span>
                      ) : (
                        `${material.usageCount} ${material.usageCount === 1 ? 'sheet' : 'sheets'}`
                      )}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${material.name}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => setBuying(material)}
                          >
                            <ReceiptText />
                            Record a purchase
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => openEditor(material)}
                          >
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setDeleting(material)}
                            className="text-red-600 focus:text-red-700 dark:text-red-400"
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={data?.page ?? page}
            limit={data?.limit ?? COSTING_LIST_LIMIT}
            total={data?.total ?? 0}
            hasMore={data?.hasMore ?? false}
            isFetching={materials.isFetching}
            onPageChange={(next) =>
              setFilter(PARAMS.PAGE, next > 1 ? String(next) : undefined)
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<PackageOpen className="size-5" />}
          title={isFiltered ? 'No materials match' : 'No raw materials yet'}
          description={
            isFiltered
              ? 'Try another search or category.'
              : 'Add what you buy to make your pieces — then build each product’s cost sheet from them.'
          }
          action={
            isFiltered ? (
              <Button
                variant="outline"
                onClick={() => setSearchParams({}, { replace: true })}
              >
                Show all materials
              </Button>
            ) : (
              <Button
                onClick={() => openEditor(null)}
                startAdornment={<Plus />}
              >
                Add your first material
              </Button>
            )
          }
        />
      )}

      <MaterialDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        material={editing}
        categories={data?.categories}
      />
      <PurchaseDialog material={buying} onClose={() => setBuying(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'this material'}?`}
        description={
          deleting && deleting.usageCount > 0
            ? `It's used in ${deleting.usageCount} cost ${deleting.usageCount === 1 ? 'sheet' : 'sheets'}, so it can't be deleted — switch it off instead, and those products keep their cost.`
            : 'Its purchase history goes with it. This can’t be undone.'
        }
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMaterial.isPending}
        onConfirm={() =>
          deleting &&
          deleteMaterial.mutate(deleting.id, {
            onSettled: () => setDeleting(null),
          })
        }
      />
    </div>
  );
};

export default MaterialsPage;
