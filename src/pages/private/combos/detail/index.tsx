import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ExternalLink,
  EyeOff,
  MessageCircle,
  PackageX,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';

import Callout from '@/components/custom/Callout';
import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { formatDateTime, formatPrice } from '@/helpers/format';
import { useCombo, useDeleteCombo } from '@/hooks/combos';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

import {
  AVAILABILITY_LABELS,
  availabilityVariant,
} from '../../products/helpers';
import ProductGallery from '../../products/detail/layouts/ProductGallery';
import { COMBO_HIDDEN_BY_PRODUCT_WARNING } from '../constants';
import { comboImages, hasInactiveProduct } from '../helpers';

const DetailField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <dt className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">
      {label}
    </dt>
    <dd className="text-sm text-stone-700 dark:text-stone-300">{children}</dd>
  </div>
);

const ComboDetailSkeleton = () => (
  <div
    className="flex w-full flex-col gap-6"
    role="status"
    aria-label="Loading"
  >
    <Skeleton className="h-8 w-36" />
    <Skeleton className="h-7 w-72 max-w-full" />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const ComboDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const combo = useCombo(slug);
  const deleteCombo = useDeleteCombo();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  useDocumentTitle(combo.data?.name ?? 'Combo');

  if (combo.isPending) {
    return <ComboDetailSkeleton />;
  }

  if (combo.isError || !combo.data) {
    return (
      <EmptyState
        icon={<PackageX className="size-5" />}
        title="Combo not found"
        description="It may have been deleted."
        className="w-full"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.PRIVATE.COMBOS.ROOT}>Back to combos</Link>
          </Button>
        }
      />
    );
  }

  const item = combo.data;
  const blockedByProduct = hasInactiveProduct(item);

  const handleDelete = () => {
    deleteCombo.mutate(item.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        navigate(ROUTES.PRIVATE.COMBOS.ROOT, { replace: true });
      },
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        to={ROUTES.PRIVATE.COMBOS.ROOT}
        className="group flex w-fit items-center gap-1 rounded-md py-1 pr-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
      >
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        Combos
      </Link>

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
            {item.isActive && blockedByProduct && (
              <Badge variant="warning">
                <EyeOff />
                Hidden on storefront
              </Badge>
            )}
            <Badge variant={availabilityVariant(item.availability)}>
              {AVAILABILITY_LABELS[item.availability]}
            </Badge>
            {item.isFeatured && (
              <Badge variant="warning">
                <Sparkles />
                Featured
              </Badge>
            )}
            <span className="ml-1 font-mono text-xs text-stone-400 dark:text-stone-500">
              /combos/{item.slug}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={ROUTES.PRIVATE.COMBOS.EDIT(item.slug)}>
              <Pencil />
              Edit
            </Link>
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

      {item.isActive && blockedByProduct && (
        <Callout
          variant="warning"
          size="md"
          title="Not shown on the storefront"
        >
          {COMBO_HIDDEN_BY_PRODUCT_WARNING} Reactivate the products marked
          Inactive below, or remove them from this combo.
        </Callout>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <ProductGallery images={comboImages(item)} name={item.name} />

        <div className="stagger flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
                  {formatPrice(item.price)}
                </span>
                {item.savings !== null && (
                  <>
                    <span className="pb-1 text-sm tabular-nums text-stone-400 line-through dark:text-stone-500">
                      {formatPrice(item.itemsTotal)}
                    </span>
                    <Badge variant="destructive" className="mb-1.5">
                      {item.discountPercentage}% off
                    </Badge>
                  </>
                )}
              </div>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {item.savings !== null
                  ? `Customers save ${formatPrice(item.savings)} versus buying the items separately.`
                  : `Costs as much as the items bought separately (${formatPrice(item.itemsTotal)}).`}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-stone-100 pt-5 sm:grid-cols-3 dark:border-stone-800">
                <DetailField label="Items">
                  <span className="font-medium tabular-nums text-stone-900 dark:text-stone-50">
                    {item.itemCount} ({item.items.length}{' '}
                    {item.items.length === 1 ? 'product' : 'products'})
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

          <Card className="gap-0 sm:gap-0 md:gap-0">
            <CardHeader className="border-b border-stone-100 pb-3 dark:border-stone-800">
              <CardTitle className="text-sm font-semibold">
                What's inside
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-0 md:px-0">
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {item.items.map(({ product, quantity }) => (
                  <li key={product.id}>
                    <Link
                      to={ROUTES.PRIVATE.PRODUCTS.DETAIL(product.slug)}
                      className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-stone-50 sm:px-4 md:px-6 dark:hover:bg-stone-800/40"
                    >
                      <ImageThumb
                        src={product.images[0]}
                        alt=""
                        className="size-10"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-stone-900 group-hover:text-accent-600 dark:text-stone-50 dark:group-hover:text-accent-400">
                            {product.name}
                          </p>
                          {!product.isActive && (
                            <Badge variant="secondary" className="shrink-0">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs tabular-nums text-stone-400 dark:text-stone-500">
                          {quantity} × {formatPrice(product.price)} ·{' '}
                          {AVAILABILITY_LABELS[product.availability]}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-stone-900 dark:text-stone-50">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
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
            </CardContent>
          </Card>

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
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete combo"
        variant="destructive"
        confirmLabel="Delete combo"
        isPending={deleteCombo.isPending}
        onConfirm={handleDelete}
        description={
          <p>
            This deletes{' '}
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {item.name}
            </span>
            . Its products are not affected. To hide it temporarily, turn it
            inactive instead.
          </p>
        }
      />
    </div>
  );
};

export default ComboDetailPage;
