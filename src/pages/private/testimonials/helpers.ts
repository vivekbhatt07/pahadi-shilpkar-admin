import { ROUTES } from '@/constants/routes';
import type { TestimonialWithListing } from '@/types/api';

/**
 * The product or combo a testimonial reviews — exactly one is set, so never
 * assume `product` is there. Null only if the API ever sends neither.
 */
export const getTestimonialListing = (testimonial: TestimonialWithListing) => {
  if (testimonial.product) {
    return {
      kind: 'Product' as const,
      name: testimonial.product.name,
      slug: testimonial.product.slug,
      to: ROUTES.PRIVATE.PRODUCTS.DETAIL(testimonial.product.slug),
    };
  }
  if (testimonial.combo) {
    return {
      kind: 'Combo' as const,
      name: testimonial.combo.name,
      slug: testimonial.combo.slug,
      to: ROUTES.PRIVATE.COMBOS.DETAIL(testimonial.combo.slug),
    };
  }
  return null;
};

/** The delete mutation's variables: refresh whichever detail holds the rating. */
export const toDeleteTestimonialVariables = (
  testimonial: TestimonialWithListing,
) => ({
  id: testimonial.id,
  productSlug: testimonial.product?.slug,
  comboSlug: testimonial.combo?.slug,
});
