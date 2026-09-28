import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, PackageX } from 'lucide-react';
import { toast } from 'sonner';

import EmptyState from '@/components/custom/EmptyState';
import PageHeader from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { applyApiFieldErrors, pickChangedFields } from '@/helpers/form';
import { useCombo, useUpdateCombo } from '@/hooks/combos';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Combo, UpdateComboPayload } from '@/types/api';

import ComboForm from '../layouts/ComboForm';
import type { TComboFormData } from '../types';

const toFormData = (combo: Combo): TComboFormData => ({
  name: combo.name,
  slug: combo.slug,
  shortDescription: combo.shortDescription ?? '',
  description: combo.description ?? '',
  price: combo.price,
  images: combo.images,
  items: combo.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    product: item.product,
  })),
  isFeatured: combo.isFeatured,
  isActive: combo.isActive,
  whatsappMessage: combo.whatsappMessage ?? '',
  purchaseLinks: combo.purchaseLinks.map((link) => ({
    ...link,
    label: link.label ?? '',
  })),
  metaTitle: combo.metaTitle ?? '',
  metaDescription: combo.metaDescription ?? '',
});

const EditComboPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const combo = useCombo(slug);
  const updateCombo = useUpdateCombo();
  useDocumentTitle(combo.data ? `Edit ${combo.data.name}` : 'Edit combo');

  const handleSubmit: React.ComponentProps<typeof ComboForm>['onSubmit'] = (
    data,
    form,
  ) => {
    if (!combo.data) return;

    // Only changed fields are sent; an unchanged name never regenerates the
    // slug, and items are sent whole whenever they changed at all.
    const changed = pickChangedFields(toFormData(combo.data), data);
    if (Object.keys(changed).length === 0) {
      toast.info('No changes to save');
      return;
    }

    const payload: UpdateComboPayload = {
      ...(changed.name !== undefined && { name: changed.name }),
      ...(changed.slug !== undefined && changed.slug && { slug: changed.slug }),
      ...(changed.shortDescription !== undefined && {
        shortDescription: changed.shortDescription || null,
      }),
      ...(changed.description !== undefined && {
        description: changed.description || null,
      }),
      ...(changed.price !== undefined && { price: changed.price }),
      ...(changed.images !== undefined && { images: changed.images }),
      ...(changed.items !== undefined && {
        items: changed.items.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
      }),
      ...(changed.isFeatured !== undefined && {
        isFeatured: changed.isFeatured,
      }),
      ...(changed.isActive !== undefined && { isActive: changed.isActive }),
      ...(changed.whatsappMessage !== undefined && {
        whatsappMessage: changed.whatsappMessage || null,
      }),
      ...(changed.purchaseLinks !== undefined && {
        purchaseLinks: changed.purchaseLinks.map((link) => ({
          ...link,
          label: link.label || null,
        })),
      }),
      ...(changed.metaTitle !== undefined && {
        metaTitle: changed.metaTitle || null,
      }),
      ...(changed.metaDescription !== undefined && {
        metaDescription: changed.metaDescription || null,
      }),
    };

    updateCombo.mutate(
      { id: combo.data.id, payload },
      {
        onSuccess: (response) => {
          navigate(
            response.data
              ? ROUTES.PRIVATE.COMBOS.DETAIL(response.data.slug)
              : ROUTES.PRIVATE.COMBOS.ROOT,
            { replace: true },
          );
        },
        onError: (error) => {
          applyApiFieldErrors(form, error);
        },
      },
    );
  };

  if (combo.isPending) {
    return (
      <div
        className="flex w-full flex-col gap-6"
        role="status"
        aria-label="Loading"
      >
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
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

  const current = combo.data;

  return (
    <div className="flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="group -ml-2 w-fit text-stone-500"
      >
        <Link to={ROUTES.PRIVATE.COMBOS.DETAIL(current.slug)}>
          <ArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
          Back to combo
        </Link>
      </Button>

      <PageHeader
        title={current.name}
        description="Only the fields you change are saved."
      />

      <ComboForm
        key={current.id}
        mode="edit"
        combo={current}
        defaultValues={toFormData(current)}
        isPending={updateCombo.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.PRIVATE.COMBOS.DETAIL(current.slug))}
      />
    </div>
  );
};

export default EditComboPage;
