import { Link as RouterLink } from 'react-router';
import {
  ArrowRight,
  ChevronRight,
  FolderPlus,
  FolderTree,
  Gift,
  MessageSquare,
  Package,
  Plus,
  Star,
  Users,
} from 'lucide-react';
import dayjs from 'dayjs';

import Callout from '@/components/custom/Callout';
import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
import PageHeader from '@/components/custom/PageHeader';
import RatingStars from '@/components/custom/RatingStars';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import {
  formatDate,
  formatDateTime,
  formatPrice,
  getDisplayName,
  getInitials,
} from '@/helpers/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProducts } from '@/hooks/products';
import { useStats } from '@/hooks/stats';
import { useAllTestimonials } from '@/hooks/testimonials';
import { useAuthStore } from '@/store/authStore';

import { getTestimonialListing } from '../testimonials/helpers';
import BuyingInterestCard from './layouts/BuyingInterestCard';
import ListSkeletonRows from './layouts/ListSkeletonRows';
import RestockDemandCard from './layouts/RestockDemandCard';
import StatCard from './layouts/StatCard';

const RECENT_LIMIT = 5;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const PanelHeader = ({
  icon,
  title,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  to: string;
}) => (
  <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 pb-3 dark:border-stone-800">
    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
      <span className="text-stone-400 [&_svg]:size-4">{icon}</span>
      {title}
    </CardTitle>
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="group/view -mr-2 gap-1 text-xs text-stone-500"
    >
      <RouterLink to={to}>
        View all
        <ArrowRight className="size-3.5 transition-transform group-hover/view:translate-x-0.5" />
      </RouterLink>
    </Button>
  </CardHeader>
);

/**
 * Every count comes from one `GET /api/stats` call; buying interest and
 * restock demand have their own stats endpoints, and the two lists are the
 * first page of theirs. Admin tokens skip the global rate limit, but five
 * cached requests keep the dashboard cheap anyway.
 */
const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const user = useAuthStore((state) => state.user);
  const stats = useStats();
  const recentProducts = useProducts({
    includeInactive: true,
    limit: RECENT_LIMIT,
  });
  const testimonials = useAllTestimonials({ limit: RECENT_LIMIT });

  const counts = stats.data;
  const recentItems = recentProducts.data?.items ?? [];
  const latestTestimonials = testimonials.data?.items ?? [];
  const hiddenComboCount = counts
    ? counts.combos.active - counts.combos.visible
    : 0;
  const newInquiryCount = counts?.inquiries.new ?? 0;

  const greeting = user?.firstName
    ? `${getGreeting()}, ${user.firstName}`
    : getGreeting();

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        title={greeting}
        description={`${dayjs().format('dddd, D MMMM')} · Here's what's happening in the Pahadi Shilpkar catalog.`}
        actions={
          <>
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <RouterLink to={`${ROUTES.PRIVATE.CATEGORIES}?new=1`}>
                <FolderPlus />
                New category
              </RouterLink>
            </Button>
            <Button asChild>
              <RouterLink to={ROUTES.PRIVATE.PRODUCTS.CREATE}>
                <Plus />
                New product
              </RouterLink>
            </Button>
          </>
        }
      />

      {counts && !counts.whatsappConfigured && (
        <Callout
          variant="warning"
          size="md"
          title="The WhatsApp buy button is off"
          action={
            <Button variant="outline" size="sm" asChild>
              <RouterLink to={ROUTES.PRIVATE.SETTINGS.STORE}>
                Set it up
              </RouterLink>
            </Button>
          }
        >
          Set a WhatsApp number in Store settings so every product gets a
          working buy button.
        </Callout>
      )}

      {hiddenComboCount > 0 && (
        <Callout
          variant="warning"
          size="md"
          title={`${hiddenComboCount} active ${
            hiddenComboCount === 1 ? 'combo is' : 'combos are'
          } hidden from the storefront`}
          action={
            <Button variant="outline" size="sm" asChild>
              <RouterLink to={`${ROUTES.PRIVATE.COMBOS.ROOT}?isActive=true`}>
                Review combos
              </RouterLink>
            </Button>
          }
        >
          A combo only shows while every product in it is active. Reactivate
          those products or remove them from the combo.
        </Callout>
      )}

      {newInquiryCount > 0 && (
        <Callout
          variant="info"
          size="md"
          title={`${newInquiryCount} new ${
            newInquiryCount === 1 ? 'inquiry' : 'inquiries'
          } from the storefront`}
          action={
            <Button variant="outline" size="sm" asChild>
              <RouterLink to={`${ROUTES.PRIVATE.INQUIRIES}?status=NEW`}>
                Read {newInquiryCount === 1 ? 'it' : 'them'}
              </RouterLink>
            </Button>
          }
        >
          Custom pieces, bulk orders and questions — a quick reply turns more of
          them into orders.
        </Callout>
      )}

      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        <StatCard
          icon={<Package />}
          tone="accent"
          label="Products"
          value={counts?.products.total}
          hint={counts && `${counts.products.active} active`}
          isLoading={stats.isPending}
          to={ROUTES.PRIVATE.PRODUCTS.ROOT}
        />
        <StatCard
          icon={<Star />}
          tone="amber"
          label="Featured products"
          value={counts?.products.featured}
          hint={counts && `${counts.products.bestseller} bestsellers`}
          isLoading={stats.isPending}
          to={`${ROUTES.PRIVATE.PRODUCTS.ROOT}?isFeatured=true`}
        />
        <StatCard
          icon={<Gift />}
          tone="emerald"
          label="Combos"
          value={counts?.combos.total}
          hint={counts && `${counts.combos.visible} on the storefront`}
          isLoading={stats.isPending}
          to={ROUTES.PRIVATE.COMBOS.ROOT}
        />
        <StatCard
          icon={<FolderTree />}
          tone="violet"
          label="Categories"
          value={counts?.categories.total}
          hint={counts && `${counts.categories.active} active`}
          isLoading={stats.isPending}
          to={ROUTES.PRIVATE.CATEGORIES}
        />
        <StatCard
          icon={<Users />}
          tone="sky"
          label="Customers"
          value={counts?.users.total}
          hint={counts && `${counts.users.verified} verified`}
          isLoading={stats.isPending}
          to={ROUTES.PRIVATE.CUSTOMERS}
        />
        <StatCard
          icon={<MessageSquare />}
          tone="rose"
          label="Testimonials"
          value={counts?.testimonials.total}
          hint={
            counts && counts.testimonials.total > 0
              ? `${counts.testimonials.avgRating.toFixed(1)} ★ average`
              : undefined
          }
          isLoading={stats.isPending}
          to={ROUTES.PRIVATE.TESTIMONIALS}
        />
      </div>

      <div className="grid animate-fade-up grid-cols-1 gap-6 [animation-delay:80ms] lg:grid-cols-2">
        <BuyingInterestCard />
        <RestockDemandCard />
      </div>

      <div className="grid animate-fade-up grid-cols-1 gap-6 [animation-delay:120ms] lg:grid-cols-2">
        <Card className="gap-0 sm:gap-0 md:gap-0">
          <PanelHeader
            icon={<Package />}
            title="Recent products"
            to={ROUTES.PRIVATE.PRODUCTS.ROOT}
          />
          <CardContent className="px-0 sm:px-0 md:px-0">
            {recentProducts.isPending ? (
              <ListSkeletonRows avatar="square" />
            ) : recentItems.length > 0 ? (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {recentItems.map((product) => (
                  <li key={product.id}>
                    <RouterLink
                      to={ROUTES.PRIVATE.PRODUCTS.DETAIL(product.slug)}
                      className="group flex items-center gap-3 px-3 py-3 transition-colors outline-none hover:bg-stone-50 focus-visible:bg-stone-50 sm:px-4 md:px-6 dark:hover:bg-stone-800/40 dark:focus-visible:bg-stone-800/40"
                    >
                      <ImageThumb
                        src={product.images[0]}
                        alt={product.name}
                        className="size-10 transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-snug font-medium text-stone-900 dark:text-stone-50">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-stone-400 dark:text-stone-500">
                          {product.category.name} ·{' '}
                          {formatDate(product.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {product.isFeatured && (
                          <Badge
                            variant="warning"
                            className="hidden gap-1 sm:inline-flex"
                          >
                            <Star className="fill-current" />
                            Featured
                          </Badge>
                        )}
                        <span className="text-sm font-medium tabular-nums text-stone-900 dark:text-stone-50">
                          {formatPrice(product.price)}
                        </span>
                        <ChevronRight className="size-4 -translate-x-1 text-stone-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:text-stone-600" />
                      </div>
                    </RouterLink>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Package className="size-5" />}
                title="No products yet"
                description="Create your first product to see it here."
                className="py-10"
                action={
                  <Button size="sm" asChild>
                    <RouterLink to={ROUTES.PRIVATE.PRODUCTS.CREATE}>
                      <Plus />
                      New product
                    </RouterLink>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 sm:gap-0 md:gap-0">
          <PanelHeader
            icon={<MessageSquare />}
            title="Latest testimonials"
            to={ROUTES.PRIVATE.TESTIMONIALS}
          />
          <CardContent className="px-0 sm:px-0 md:px-0">
            {testimonials.isPending ? (
              <ListSkeletonRows avatar="circle" />
            ) : latestTestimonials.length > 0 ? (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {latestTestimonials.map((testimonial) => {
                  const listing = getTestimonialListing(testimonial);
                  return (
                    <li
                      key={testimonial.id}
                      className="flex gap-3 px-3 py-3 transition-colors hover:bg-stone-50/60 sm:px-4 md:px-6 dark:hover:bg-stone-800/20"
                    >
                      <Avatar className="size-9 shrink-0 border border-stone-200 dark:border-stone-800">
                        <AvatarImage
                          src={testimonial.user.avatar || undefined}
                          alt={getDisplayName(testimonial.user)}
                        />
                        <AvatarFallback className="bg-stone-100 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                          {getInitials(testimonial.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                            {getDisplayName(testimonial.user)}
                          </p>
                          <RatingStars rating={testimonial.rating} size={12} />
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                          “{testimonial.content}”
                        </p>
                        {listing ? (
                          <RouterLink
                            to={listing.to}
                            className="mt-1 block truncate text-xs text-stone-400 transition-colors hover:text-accent-600 dark:text-stone-500 dark:hover:text-accent-400"
                          >
                            on {listing.kind === 'Combo' && 'combo '}
                            {listing.name} ·{' '}
                            {formatDateTime(testimonial.createdAt)}
                          </RouterLink>
                        ) : (
                          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                            {formatDateTime(testimonial.createdAt)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<MessageSquare className="size-5" />}
                title="No testimonials yet"
                description="Customer testimonials will appear here once submitted."
                className="py-10"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
