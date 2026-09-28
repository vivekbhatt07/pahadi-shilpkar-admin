/**
 * Shared API contract types. These mirror the backend exactly — do not add
 * fields the backend does not return.
 */

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  avatar: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

/* ── Categories ────────────────────────────────────────────────── */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Direct products only (not descendants). */
export interface CategoryWithCount extends Category {
  productCount: number;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryTreeNode extends CategoryWithCount {
  children: CategoryTreeNode[];
}

/** Only from GET /api/categories/:slug */
export interface CategoryDetail extends CategoryWithCount {
  parent: CategoryRef | null;
  /** Root → this category (inclusive). */
  breadcrumbs: CategoryRef[];
  /** Direct children only. */
  children: CategoryWithCount[];
}

/* ── Products ──────────────────────────────────────────────────── */

export type ProductAvailability =
  | 'IN_STOCK'
  | 'OUT_OF_STOCK'
  | 'MADE_TO_ORDER'
  | 'COMING_SOON';

export type PurchaseLinkPlatform =
  | 'AMAZON'
  | 'FLIPKART'
  | 'MEESHO'
  | 'ETSY'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'WEBSITE'
  | 'OTHER';

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface PurchaseLink {
  platform: PurchaseLinkPlatform;
  label: string | null;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  /** Stored UPPERCASE, unique. */
  sku: string | null;
  shortDescription: string | null;
  description: string | null;
  highlights: string[];
  price: number;
  /** MRP / strike-through; always > price when set. */
  compareAtPrice: number | null;
  /** Read-only, derived from compareAtPrice. */
  discountPercentage: number | null;
  images: string[];
  videoUrl: string | null;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  careInstructions: string | null;
  specifications: ProductSpecification[];
  /** Stored lowercase, deduped. */
  tags: string[];
  stock: number;
  /** Admin-chosen; independent of stock. */
  availability: ProductAvailability;
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  /** Per-product override of the store template. */
  whatsappMessage: string | null;
  /** Read-only, derived; null until a WhatsApp number is set in settings. */
  whatsappUrl: string | null;
  purchaseLinks: PurchaseLink[];
  metaTitle: string | null;
  metaDescription: string | null;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

/** Only from GET /api/products/:slug */
export interface ProductDetail extends Product {
  avgRating: number;
  testimonialCount: number;
  /** Root → the product's category. */
  breadcrumbs: CategoryRef[];
  /** Up to 4 active products from the same category. */
  relatedProducts: Product[];
  /** Up to 4 combos containing this product (hidden ones included for admins). */
  combos: Combo[];
}

/* ── Combos ────────────────────────────────────────────────────── */

/** The slice of a product a combo carries for each of its items. */
export interface ComboProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  availability: ProductAvailability;
  isActive: boolean;
}

export interface ComboItem {
  productId: string;
  /** 1–99 */
  quantity: number;
  product: ComboProduct;
}

/**
 * A bundle of existing products sold at one price. Every read-only field is
 * derived from the items' current product data on each read.
 */
export interface Combo {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  /** May be empty — fall back to the items' product images. */
  images: string[];
  price: number;
  /** Read-only: sum of item price × quantity ("worth"). */
  itemsTotal: number;
  /** Read-only: itemsTotal − price; null unless the combo is cheaper. */
  savings: number | null;
  /** Read-only, derived from itemsTotal; null unless cheaper. */
  discountPercentage: number | null;
  /** Read-only: the least available item wins; an inactive product counts as out of stock. */
  availability: ProductAvailability;
  /** Read-only: total units across items. */
  itemCount: number;
  /** Display order = the order sent on create/update. */
  items: ComboItem[];
  isFeatured: boolean;
  isActive: boolean;
  /** Per-combo override of the store template. */
  whatsappMessage: string | null;
  /** Read-only; {{productUrl}} links to the storefront's /combos/:slug. */
  whatsappUrl: string | null;
  purchaseLinks: PurchaseLink[];
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Dashboard ─────────────────────────────────────────────────── */

/** Only from GET /api/stats */
export interface DashboardStats {
  products: {
    total: number;
    active: number;
    featured: number;
    bestseller: number;
    /** Every availability key is always present. */
    byAvailability: Record<ProductAvailability, number>;
  };
  categories: { total: number; active: number };
  combos: {
    total: number;
    active: number;
    /** What the storefront shows — active with every product active. */
    visible: number;
    featured: number;
  };
  users: { total: number; verified: number; admins: number };
  /** avgRating is 0 when there are none. */
  testimonials: { total: number; avgRating: number };
  whatsappConfigured: boolean;
}

/* ── Store settings ────────────────────────────────────────────── */

export interface StoreSettings {
  /** Digits only with country code, e.g. "919876543210". */
  whatsappNumber: string | null;
  /** Placeholders: {{productName}} {{price}} {{productUrl}} */
  whatsappMessageTemplate: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  /** Null until first saved. */
  updatedAt: string | null;
}

/* ── Testimonials ──────────────────────────────────────────────── */

export interface Testimonial {
  id: string;
  content: string;
  rating: number;
  userId: string;
  productId: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

/** Only from GET /api/testimonials/all */
export interface TestimonialWithProduct extends Testimonial {
  product: { id: string; name: string; slug: string };
}

export interface TestimonialListParams {
  page?: number;
  limit?: number;
}

/* ── Uploads ───────────────────────────────────────────────────── */

export interface UploadedImage {
  url: string;
  publicId: string;
}

/* ── Request payloads ─────────────────────────────────────────── */

export interface SignInPayload {
  email: string;
  password: string;
}

/** `bio: null` / `avatar: null` clear those fields. */
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string | null;
  avatar?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface CategoryListParams {
  parentId?: string;
  rootOnly?: boolean;
  includeInactive?: boolean;
}

export interface CategoryTreeParams {
  includeInactive?: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ReorderCategoriesPayload {
  items: { id: string; sortOrder: number }[];
}

export type ProductSort =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc';

export interface ProductListParams {
  categoryId?: string;
  categorySlug?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  availability?: ProductAvailability;
  tag?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  limit?: number;
  /** `false` implies includeInactive on the backend. */
  isActive?: boolean;
  includeInactive?: boolean;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  categoryId: string;
  slug?: string;
  sku?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  highlights?: string[];
  compareAtPrice?: number | null;
  images?: string[];
  videoUrl?: string | null;
  material?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  careInstructions?: string | null;
  specifications?: ProductSpecification[];
  tags?: string[];
  stock?: number;
  availability?: ProductAvailability;
  isFeatured?: boolean;
  isBestseller?: boolean;
  whatsappMessage?: string | null;
  purchaseLinks?: PurchaseLink[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  isActive?: boolean;
}

export interface ComboListParams {
  /** Combos containing this product. */
  productId?: string;
  isFeatured?: boolean;
  /** Matches combo name / descriptions and the names of the products inside. */
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  limit?: number;
  isActive?: boolean;
  includeInactive?: boolean;
}

export interface ComboItemPayload {
  productId: string;
  quantity?: number;
}

export interface CreateComboPayload {
  name: string;
  price: number;
  items: ComboItemPayload[];
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  images?: string[];
  isFeatured?: boolean;
  whatsappMessage?: string | null;
  purchaseLinks?: PurchaseLink[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

/** `items`, when sent, replaces the whole list. */
export interface UpdateComboPayload extends Partial<CreateComboPayload> {
  isActive?: boolean;
}

export interface UpdateSettingsPayload {
  whatsappNumber?: string | null;
  whatsappMessageTemplate?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
}

export interface UserListParams {
  role?: Role;
  search?: string;
  page?: number;
  limit?: number;
}
