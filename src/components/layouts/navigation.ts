import {
  Calculator,
  FolderTree,
  GalleryHorizontalEnd,
  Gift,
  Hammer,
  History,
  Inbox,
  Layers,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Package,
  PackageOpen,
  Palette,
  Percent,
  ReceiptIndianRupee,
  Store,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { ROUTES } from '@/constants/routes';

export type TNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match the route exactly (dashboard) instead of as a prefix. */
  end?: boolean;
  /** Highlight for this path prefix instead of `to` (e.g. all of /settings). */
  matchPath?: string;
  /** Extra search terms for the command palette. */
  keywords?: string;
  /** A live count shown beside the item in the sidebar. */
  badge?: 'newInquiries' | 'testimonialQueue';
};

export type TNavSection = {
  label: string;
  items: TNavItem[];
};

/** Shared by the sidebar and the command palette. */
export const NAV_SECTIONS: TNavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        to: ROUTES.PRIVATE.DASHBOARD,
        icon: LayoutDashboard,
        end: true,
        keywords: 'home overview stats',
      },
      {
        label: 'Activity',
        to: ROUTES.PRIVATE.ACTIVITY,
        icon: History,
        keywords: 'log history audit changes who changed',
      },
    ],
  },
  {
    label: 'Catalog',
    items: [
      {
        label: 'Categories',
        to: ROUTES.PRIVATE.CATEGORIES,
        icon: FolderTree,
        keywords: 'tree collections',
      },
      {
        label: 'Products',
        to: ROUTES.PRIVATE.PRODUCTS.ROOT,
        icon: Package,
        keywords: 'items catalog inventory',
      },
      {
        label: 'Variants',
        to: ROUTES.PRIVATE.VARIANTS,
        icon: Layers,
        keywords: 'inventory stock restock designs sizes colours low stock',
      },
      {
        label: 'Combos',
        to: ROUTES.PRIVATE.COMBOS.ROOT,
        icon: Gift,
        keywords: 'bundles gift sets packs',
      },
    ],
  },
  {
    label: 'Storefront',
    items: [
      {
        label: 'Banners',
        to: ROUTES.PRIVATE.BANNERS,
        icon: GalleryHorizontalEnd,
        keywords: 'home page slides carousel hero promotions campaigns',
      },
      {
        label: 'How we make it',
        to: ROUTES.PRIVATE.PROCESS,
        icon: Hammer,
        keywords: 'process craft story steps artisans making about page',
      },
    ],
  },
  {
    label: 'Community',
    items: [
      {
        label: 'Inquiries',
        to: ROUTES.PRIVATE.INQUIRIES,
        icon: Inbox,
        keywords: 'messages contact custom bulk orders requests inbox',
        badge: 'newInquiries',
      },
      {
        label: 'Testimonials',
        to: ROUTES.PRIVATE.TESTIMONIALS,
        icon: MessageSquare,
        keywords: 'reviews ratings feedback moderation approve photos',
        badge: 'testimonialQueue',
      },
      {
        label: 'Customers',
        to: ROUTES.PRIVATE.CUSTOMERS,
        icon: Users,
        keywords: 'users people accounts',
      },
    ],
  },
  {
    label: 'Business',
    items: [
      {
        label: 'Costing & profit',
        to: ROUTES.PRIVATE.COSTING.ROOT,
        icon: TrendingUp,
        end: true,
        keywords: 'profit revenue earnings report margin money accounts',
      },
      {
        label: 'Product costs',
        to: ROUTES.PRIVATE.COSTING.LISTINGS,
        icon: Calculator,
        matchPath: ROUTES.PRIVATE.COSTING.LISTINGS,
        keywords:
          'cost sheet bill of materials margin pricing underpriced suggested price',
      },
      {
        label: 'Raw materials',
        to: ROUTES.PRIVATE.COSTING.MATERIALS,
        icon: PackageOpen,
        keywords:
          'materials supplies purchases paint plate lace supplier price',
      },
      {
        label: 'Sales',
        to: ROUTES.PRIVATE.COSTING.SALES,
        icon: ReceiptIndianRupee,
        keywords: 'orders ledger whatsapp sales record accounts csv',
      },
    ],
  },
];

export const SETTINGS_ITEMS: TNavItem[] = [
  {
    label: 'Profile',
    to: ROUTES.PRIVATE.SETTINGS.PROFILE,
    icon: User,
    keywords: 'account name avatar email',
  },
  {
    label: 'Security',
    to: ROUTES.PRIVATE.SETTINGS.SECURITY,
    icon: Lock,
    keywords: 'password',
  },
  {
    label: 'Store',
    to: ROUTES.PRIVATE.SETTINGS.STORE,
    icon: Store,
    keywords: 'whatsapp contact social low stock',
  },
  {
    label: 'Costing',
    to: ROUTES.PRIVATE.SETTINGS.COSTING,
    icon: Percent,
    keywords: 'commission marketplace fees gst tax target margin',
  },
  {
    label: 'Appearance',
    to: ROUTES.PRIVATE.SETTINGS.APPEARANCE,
    icon: Palette,
    keywords: 'theme dark light accent color',
  },
];
