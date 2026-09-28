import {
  FolderTree,
  Gift,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Package,
  Palette,
  Store,
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
        label: 'Combos',
        to: ROUTES.PRIVATE.COMBOS.ROOT,
        icon: Gift,
        keywords: 'bundles gift sets packs',
      },
    ],
  },
  {
    label: 'Community',
    items: [
      {
        label: 'Testimonials',
        to: ROUTES.PRIVATE.TESTIMONIALS,
        icon: MessageSquare,
        keywords: 'reviews ratings feedback',
      },
      {
        label: 'Customers',
        to: ROUTES.PRIVATE.CUSTOMERS,
        icon: Users,
        keywords: 'users people accounts',
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
    keywords: 'whatsapp contact social',
  },
  {
    label: 'Appearance',
    to: ROUTES.PRIVATE.SETTINGS.APPEARANCE,
    icon: Palette,
    keywords: 'theme dark light accent color',
  },
];
