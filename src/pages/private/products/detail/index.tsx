import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Boxes,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderTree,
  Gift,
  MessageCircle,
  PackageX,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
} from 'lucide-react';

import Callout from '@/components/custom/Callout';
import ColorSwatch from '@/components/custom/ColorSwatch';
import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { formatDateTime, formatPrice } from '@/helpers/format';
import {
  isProductInCombosError,
  useDeleteProduct,
  useDuplicateProduct,
  useProduct,
} from '@/hooks/products';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';

import {
  comboImages,
  isComboHidden,
  toComboProduct,
} from '../../combos/helpers';
import { PRODUCT_DETAIL_COMBOS_LIMIT } from '../../combos/constants';
import type { TCreateComboState } from '../../combos/types';
import ListingTestimonials from '../../testimonials/layouts/ListingTestimonials';
import { PRODUCT_DELETE_CONFIRMATION } from '../constants';
import { AVAILABILITY_LABELS, availabilityVariant } from '../helpers';
import ProductGallery from './layouts/ProductGallery';

const DetailField = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <dt className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">
      {label}
    </dt>
    <dd className="text-sm text-stone-700 dark:text-stone-300">{children}</dd>
  </div>
);

const ProductDetailSkeleton = () => (
  <div
    className="flex w-full flex-col gap-6"
    role="status"
    aria-label="Loading"
  >
    <Skeleton className="h-8 w-36" />
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-72 max-w-full" />
      <Skeleton className="h-3 w-40" />
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const product = useProduct(slug);
  const deleteProduct = useDeleteProduct();
  const duplicateProduct = useDuplicateProduct();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  useDocumentTitle(product.data?.name ?? 'Product');

  if (product.isPending) {
    return <ProductDetailSkeleton />;
  }

  if (product.isError || !product.data) {
    return (
      <EmptyState
        icon={<PackageX className="size-5" />}
        title="Product not found"
        description="It may have been deleted."
        className="w-full"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.PRIVATE.PRODUCTS.ROOT}>Back to products</Link>
          </Button>
        }
      />
    );
  }

  const item = product.data;
  // "Round · Diameter 30 cm × Height 2 cm", then the admin's note, if any.
  const [dimensionsLine, ...dimensionsNote] =
    item.dimensions?.split('\n') ?? [];

  const handleDelete = () => {
    deleteProduct.mutate(item.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        navigate(ROUTES.PRIVATE.PRODUCTS.ROOT, { replace: true });
      },
      // Retrying can't help; close so the toast's "View combos" is clickable.
      onError: (error) => {
        if (isProductInCombosError(error)) setIsDeleteOpen(false);
      },
    });
  };

  const hasCraftDetails =
    item.material ||
    item.dimensions ||
    item.colors.length > 0 ||
    item.weight ||
    item.careInstructions ||
    item.specifications.length > 0;

  return (
    <div className="flex w-full flex-col gap-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1 text-xs text-stone-500 dark:text-stone-400"
      >
        <Link
          to={ROUTES.PRIVATE.PRODUCTS.ROOT}
          className="group flex items-center gap-1 rounded-md py-1 pr-1.5 font-medium transition-colors hover:text-stone-900 dark:hover:text-stone-50"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Products
        </Link>
        {item.breadcrumbs.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="size-3 text-stone-300 dark:text-stone-600" />
            <Link
              to={`${ROUTES.PRIVATE.PRODUCTS.ROOT}?categoryId=${crumb.id}`}
              className="rounded-md px-1 py-1 transition-colors hover:text-stone-900 dark:hover:text-stone-50"
            >
              {crumb.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {item.name}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={item.isActive ? 'success' : 'destructive'}>
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-current opacity-80"
              />
              {item.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant={availabilityVariant(item.availability)}>
              {AVAILABILITY_LABELS[item.availability]}
            </Badge>
            {item.isFeatured && (
              <Badge variant="warning">
                <Sparkles />
                Featured
              </Badge>
            )}
            {item.isBestseller && (
              <Badge variant="warning">
                <TrendingUp />
                Bestseller
              </Badge>
            )}
            <span className="ml-1 font-mono text-xs text-stone-400 dark:text-stone-500">
              /{item.slug}
              {item.sku && ` · SKU ${item.sku}`}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={ROUTES.PRIVATE.PRODUCTS.EDIT(item.slug)}>
              <Pencil />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => duplicateProduct.mutate(item.id)}
            disabled={duplicateProduct.isPending}
          >
            <Copy />
            Duplicate
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/30 dark:hover:text-red-300"
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <ProductGallery images={item.images} name={item.name} />

        <div className="stagger flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
                  {formatPrice(item.price)}
                </span>
                {item.compareAtPrice !== null && (
                  <span className="pb-1 text-sm tabular-nums text-stone-400 line-through dark:text-stone-500">
                    {formatPrice(item.compareAtPrice)}
                  </span>
                )}
                {item.discountPercentage !== null && (
                  <Badge variant="destructive" className="mb-1.5">
                    {item.discountPercentage}% off
                  </Badge>
                )}
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-stone-100 pt-5 sm:grid-cols-3 dark:border-stone-800">
                <DetailField label="Stock">
                  <span className="flex items-center gap-1.5 font-medium tabular-nums text-stone-900 dark:text-stone-50">
                    <Boxes className="size-4 text-stone-400" />
                    {item.stock}
                    {item.stock === 0 && (
                      <Badge variant="destructive">Out of stock</Badge>
                    )}
                  </span>
                </DetailField>
                <DetailField label="Category">
                  <Link
                    to={`${ROUTES.PRIVATE.PRODUCTS.ROOT}?categoryId=${item.categoryId}`}
                    className="flex items-center gap-1.5 font-medium text-stone-900 transition-colors hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
                  >
                    <FolderTree className="size-4 text-stone-400" />
                    {item.category.name}
                  </Link>
                </DetailField>
                <DetailField label="Rating">
                  <span className="flex items-center gap-1.5">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-stone-900 tabular-nums dark:text-stone-50">
                      {item.avgRating.toFixed(1)}
                    </span>
                    <span className="text-stone-400">
                      ({item.testimonialCount})
                    </span>
                  </span>
                </DetailField>
                <DetailField label="Created">
                  {formatDateTime(item.createdAt)}
                </DetailField>
                <DetailField label="Updated">
                  {formatDateTime(item.updatedAt)}
                </DetailField>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {item.shortDescription && (
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {item.shortDescription}
                </p>
              )}
              {item.description ? (
                <p className="text-sm leading-relaxed whitespace-pre-line text-stone-600 dark:text-stone-300">
                  {item.description}
                </p>
              ) : (
                <p className="text-sm text-stone-400 italic dark:text-stone-500">
                  No description yet.
                </p>
              )}
              {item.highlights.length > 0 && (
                <ul className="flex flex-col gap-2 text-sm text-stone-700 dark:text-stone-300">
                  {item.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent-500" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {hasCraftDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Craft details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {(item.material ||
                  item.dimensions ||
                  item.weight ||
                  item.colors.length > 0) && (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    {item.material && (
                      <DetailField label="Material">
                        {item.material}
                      </DetailField>
                    )}
                    {item.weight && (
                      <DetailField label="Weight">{item.weight}</DetailField>
                    )}
                    {item.dimensions && (
                      <DetailField label="Dimensions" className="col-span-full">
                        <span className="block">{dimensionsLine}</span>
                        {dimensionsNote.length > 0 && (
                          <span className="mt-0.5 block text-xs whitespace-pre-line text-stone-500 dark:text-stone-400">
                            {dimensionsNote.join('\n')}
                          </span>
                        )}
                        {!item.measurements && (
                          <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">
                            Entered before measurements —{' '}
                            <Link
                              to={ROUTES.PRIVATE.PRODUCTS.EDIT(item.slug)}
                              className="underline underline-offset-2"
                            >
                              re-enter them with a shape
                            </Link>{' '}
                            so shoppers can tell round from square.
                          </span>
                        )}
                      </DetailField>
                    )}
                    {item.colors.length > 0 && (
                      <DetailField label="Colours" className="col-span-full">
                        <ul className="flex flex-wrap gap-1.5">
                          {item.colors.map((color) => (
                            <li
                              key={color.name}
                              title={color.hex ?? 'No swatch'}
                              className="flex items-center gap-1.5 rounded-full border border-stone-200 py-1 pr-2.5 pl-1.5 text-xs font-medium text-stone-700 dark:border-stone-700 dark:text-stone-300"
                            >
                              <ColorSwatch hex={color.hex} />
                              {color.name}
                            </li>
                          ))}
                        </ul>
                      </DetailField>
                    )}
                  </dl>
                )}
                {item.careInstructions && (
                  <div className="rounded-lg bg-stone-50 px-3 py-2.5 dark:bg-stone-800/40">
                    <p className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">
                      Care instructions
                    </p>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-stone-700 dark:text-stone-300">
                      {item.careInstructions}
                    </p>
                  </div>
                )}
                {item.specifications.length > 0 && (
                  <dl className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-100 text-sm dark:divide-stone-800 dark:border-stone-800">
                    {item.specifications.map((spec) => (
                      <div
                        key={spec.label}
                        className="flex justify-between gap-4 px-3 py-2 odd:bg-stone-50/60 dark:odd:bg-stone-800/20"
                      >
                        <dt className="text-stone-500 dark:text-stone-400">
                          {spec.label}
                        </dt>
                        <dd className="text-right font-medium text-stone-800 dark:text-stone-200">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </CardContent>
            </Card>
          )}

          {(item.purchaseLinks.length > 0 || item.whatsappUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Where to buy
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {item.whatsappUrl && (
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <a href={item.whatsappUrl} target="_blank" rel="noreferrer">
                      <MessageCircle />
                      WhatsApp
                      <ExternalLink className="size-3.5 opacity-70" />
                    </a>
                  </Button>
                )}
                {item.purchaseLinks.map((link, index) => (
                  <Button
                    key={`${link.url}-${index}`}
                    asChild
                    size="sm"
                    variant="outline"
                    className="group"
                  >
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.label || link.platform}
                      <ExternalLink className="size-3.5 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="gap-0 sm:gap-0 md:gap-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 pb-3 dark:border-stone-800">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Gift className="size-4 text-stone-400" />
                Part of these combos
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="-mr-2 text-xs text-stone-500"
              >
                <Link
                  to={ROUTES.PRIVATE.COMBOS.CREATE}
                  state={
                    {
                      product: toComboProduct(item),
                    } satisfies TCreateComboState
                  }
                >
                  <Plus />
                  New combo with this product
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-0 sm:px-0 md:px-0">
              {item.combos.length === 0 ? (
                <p className="px-3 py-4 text-sm text-stone-400 sm:px-4 md:px-6 dark:text-stone-500">
                  Not in any combo yet.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {item.combos.map((combo) => {
                    const quantity =
                      combo.items.find(
                        (comboItem) => comboItem.productId === item.id,
                      )?.quantity ?? 1;
                    return (
                      <li key={combo.id}>
                        <Link
                          to={ROUTES.PRIVATE.COMBOS.DETAIL(combo.slug)}
                          className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-stone-50 sm:px-4 md:px-6 dark:hover:bg-stone-800/40"
                        >
                          <ImageThumb
                            src={comboImages(combo)[0]}
                            alt=""
                            className="size-10"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-medium text-stone-900 group-hover:text-accent-600 dark:text-stone-50 dark:group-hover:text-accent-400">
                                {combo.name}
                              </p>
                              {isComboHidden(combo) && (
                                <Badge variant="secondary" className="shrink-0">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                              {quantity > 1
                                ? `${quantity} × this product · `
                                : ''}
                              {combo.itemCount} items in total
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums text-stone-900 dark:text-stone-50">
                            {formatPrice(combo.price)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              {item.combos.length > 0 && (
                <Link
                  to={`${ROUTES.PRIVATE.COMBOS.ROOT}?productId=${item.id}`}
                  className="block border-t border-stone-100 px-3 py-2.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900 sm:px-4 md:px-6 dark:border-stone-800 dark:text-stone-400 dark:hover:text-stone-50"
                >
                  View all combos with this product
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ListingTestimonials type="product" listing={item} />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete product"
        variant="destructive"
        confirmLabel="Delete permanently"
        confirmText={PRODUCT_DELETE_CONFIRMATION}
        isPending={deleteProduct.isPending}
        onConfirm={handleDelete}
        description={
          <div className="flex flex-col gap-3">
            <p>
              This permanently deletes{' '}
              <span className="font-medium text-stone-900 dark:text-stone-50">
                {item.name}
              </span>{' '}
              and all {item.testimonialCount} of its testimonials. This cannot
              be undone.
            </p>
            {item.combos.length > 0 && (
              <Callout variant="warning">
                It's part of {item.combos.length}
                {item.combos.length >= PRODUCT_DETAIL_COMBOS_LIMIT
                  ? '+'
                  : ''}{' '}
                {item.combos.length === 1 ? 'combo' : 'combos'}, so the delete
                will be refused until you remove it from them. Deactivating it
                instead hides it and its combos from the storefront.
              </Callout>
            )}
          </div>
        }
      />
    </div>
  );
};

export default ProductDetailPage;
