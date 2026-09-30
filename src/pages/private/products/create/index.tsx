import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import PageHeader from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { applyApiFieldErrors } from '@/helpers/form';
import { useCreateProduct } from '@/hooks/products';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

import { EMPTY_MEASUREMENTS, toMeasurementsPayload } from '../helpers';
import ProductForm from '../layouts/ProductForm';
import type { TProductFormData } from '../types';

const DEFAULT_VALUES: TProductFormData = {
  name: '',
  slug: '',
  sku: '',
  shortDescription: '',
  description: '',
  highlights: [],
  price: Number.NaN,
  compareAtPrice: null,
  images: [],
  videoUrl: '',
  material: '',
  colors: [],
  measurements: EMPTY_MEASUREMENTS,
  legacyDimensions: null,
  weight: '',
  careInstructions: '',
  specifications: [],
  tags: [],
  stock: 0,
  availability: 'IN_STOCK',
  isFeatured: false,
  isBestseller: false,
  isActive: true,
  whatsappMessage: '',
  purchaseLinks: [],
  metaTitle: '',
  metaDescription: '',
  categoryId: '',
};

const CreateProductPage = () => {
  useDocumentTitle('New product');
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  const handleSubmit: React.ComponentProps<typeof ProductForm>['onSubmit'] = (
    data,
    form,
  ) => {
    const measurements = toMeasurementsPayload(data.measurements);
    createProduct.mutate(
      {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId,
        ...(data.slug && { slug: data.slug }),
        ...(data.sku && { sku: data.sku }),
        ...(data.shortDescription && {
          shortDescription: data.shortDescription,
        }),
        ...(data.description && { description: data.description }),
        highlights: data.highlights,
        ...(data.compareAtPrice !== null && {
          compareAtPrice: data.compareAtPrice,
        }),
        images: data.images,
        ...(data.videoUrl && { videoUrl: data.videoUrl }),
        ...(data.material && { material: data.material }),
        colors: data.colors,
        ...(measurements && { measurements }),
        ...(data.weight && { weight: data.weight }),
        ...(data.careInstructions && {
          careInstructions: data.careInstructions,
        }),
        specifications: data.specifications,
        tags: data.tags,
        stock: data.stock,
        availability: data.availability,
        isFeatured: data.isFeatured,
        isBestseller: data.isBestseller,
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
              ? ROUTES.PRIVATE.PRODUCTS.DETAIL(response.data.slug)
              : ROUTES.PRIVATE.PRODUCTS.ROOT,
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
        <Link to={ROUTES.PRIVATE.PRODUCTS.ROOT}>
          <ArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
          Back to products
        </Link>
      </Button>

      <PageHeader
        title="New product"
        description="Products are created active and visible on the storefront immediately."
      />

      <ProductForm
        mode="create"
        defaultValues={DEFAULT_VALUES}
        isPending={createProduct.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.PRIVATE.PRODUCTS.ROOT)}
      />
    </div>
  );
};

export default CreateProductPage;
