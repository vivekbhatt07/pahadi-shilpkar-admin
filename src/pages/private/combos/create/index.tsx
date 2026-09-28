import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import PageHeader from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { applyApiFieldErrors } from '@/helpers/form';
import { useCreateCombo } from '@/hooks/combos';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ComboProduct } from '@/types/api';

import ComboForm from '../layouts/ComboForm';
import type { TComboFormData, TCreateComboState } from '../types';

const buildDefaultValues = (product?: ComboProduct): TComboFormData => ({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  price: Number.NaN,
  images: [],
  items: product ? [{ productId: product.id, quantity: 1, product }] : [],
  isFeatured: false,
  isActive: true,
  whatsappMessage: '',
  purchaseLinks: [],
  metaTitle: '',
  metaDescription: '',
});

const CreateComboPage = () => {
  useDocumentTitle('New combo');
  const navigate = useNavigate();
  const location = useLocation();
  const createCombo = useCreateCombo();
  const startProduct = (location.state as TCreateComboState)?.product;

  const handleSubmit: React.ComponentProps<typeof ComboForm>['onSubmit'] = (
    data,
    form,
  ) => {
    createCombo.mutate(
      {
        name: data.name,
        price: data.price,
        items: data.items.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
        ...(data.slug && { slug: data.slug }),
        ...(data.shortDescription && {
          shortDescription: data.shortDescription,
        }),
        ...(data.description && { description: data.description }),
        images: data.images,
        isFeatured: data.isFeatured,
        ...(data.whatsappMessage && { whatsappMessage: data.whatsappMessage }),
        purchaseLinks: data.purchaseLinks.map((link) => ({
          ...link,
          label: link.label || null,
        })),
        ...(data.metaTitle && { metaTitle: data.metaTitle }),
        ...(data.metaDescription && { metaDescription: data.metaDescription }),
      },
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

  return (
    <div className="flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="group -ml-2 w-fit text-stone-500"
      >
        <Link to={ROUTES.PRIVATE.COMBOS.ROOT}>
          <ArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
          Back to combos
        </Link>
      </Button>

      <PageHeader
        title="New combo"
        description="Bundle existing products at one price. Combos are created active and appear on the storefront once every product in them is active."
      />

      <ComboForm
        mode="create"
        defaultValues={buildDefaultValues(startProduct)}
        isPending={createCombo.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.PRIVATE.COMBOS.ROOT)}
      />
    </div>
  );
};

export default CreateComboPage;
