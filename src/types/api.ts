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

/**
 * A colour the piece is made in ("Geru red"). It describes this one product —
 * it is not a variant a shopper picks.
 */
export interface ProductColor {
  /** ≤30, unique per product ignoring case. */
  name: string;
  /** Always returned as lowercase "#rrggbb"; null = no swatch (wood grain, multicolour). */
  hex: string | null;
}

export type ProductShape = 'RECTANGULAR' | 'ROUND' | 'OVAL' | 'IRREGULAR';

export type MeasurementUnit = 'MM' | 'CM' | 'M' | 'IN' | 'FT';

export type ProductSize = 'length' | 'width' | 'height' | 'diameter';

/** The shape decides which sizes apply; sizes it doesn't use are always null. */
export interface ProductMeasurements {
  shape: ProductShape;
  /** One unit for every size. */
  unit: MeasurementUnit;
  length: number | null;
  width: number | null;
  height: number | null;
  diameter: number | null;
  /** ≤100, e.g. "Each piece is hand-carved, so sizes vary slightly". */
  note: string | null;
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
  /** Display order; [] when none. */
  colors: ProductColor[];
  /** Null until measured. */
  measurements: ProductMeasurements | null;
  /**
   * Read-only, derived from measurements: "Round · Diameter 30 cm × Height 2 cm",
   * with the note (if any) on a second line after "\n". A product saved before
   * measurements existed has measurements: null and its old free text here.
   */
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
  /** Read-only; 0 when there are no testimonials. On every product response. */
  avgRating: number;
  testimonialCount: number;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

/** Only from GET /api/products/:slug */
export interface ProductDetail extends Product {
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
  /**
   * Read-only; the combo's own testimonials, never its products'. 0 when
   * there are none.
   */
  avgRating: number;
  testimonialCount: number;
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
  /** Product and combo testimonials together; avgRating is 0 when there are none. */
  testimonials: { total: number; avgRating: number };
  /** `new` = status NEW, not looked at yet. */
  inquiries: { total: number; new: number };
  whatsappConfigured: boolean;
}

export interface BuyClickCounts {
  clicks: number;
  whatsapp: number;
  marketplace: number;
}

export interface DailyBuyClicks {
  /** An India-time calendar date, "2026-09-29". */
  date: string;
  whatsapp: number;
  marketplace: number;
}

/**
 * Only from GET /api/stats/buy-clicks — storefront buy-button clicks over the
 * last `days` days. Orders happen off-site, so this is the demand signal.
 */
export interface BuyClickStats {
  /** The last `days` India-time calendar days, today included. */
  days: number;
  total: number;
  byChannel: { WHATSAPP: number; MARKETPLACE: number };
  /** One entry per day, oldest first, quiet days included — sums to the totals. */
  daily: DailyBuyClicks[];
  /** Marketplace clicks, most clicked first. */
  byPlatform: { platform: PurchaseLinkPlatform; clicks: number }[];
  /** Top 5 each. */
  topProducts: (BuyClickCounts & {
    product: { id: string; name: string; slug: string; images: string[] };
  })[];
  topCombos: (BuyClickCounts & {
    combo: { id: string; name: string; slug: string; images: string[] };
  })[];
}

/** Only from GET /api/stats/stock-alerts — products shoppers are waiting on. */
export interface StockAlertStats {
  /** Shoppers waiting, across all products. */
  total: number;
  /** Up to 20, most wanted first. */
  products: {
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[];
      availability: ProductAvailability;
      isActive: boolean;
    };
    waiting: number;
    /** When the longest-waiting shopper asked. */
    since: string;
  }[];
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

/** Exactly one of productId / comboId is set — the product or the combo reviewed. */
export interface Testimonial {
  id: string;
  content: string;
  /** 1–5 */
  rating: number;
  userId: string;
  productId: string | null;
  comboId: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Only from GET /api/testimonials/all. Exactly one of product / combo is set,
 * matching productId / comboId — never assume `product` is there.
 */
export interface TestimonialWithListing extends Testimonial {
  product: { id: string; name: string; slug: string } | null;
  combo: { id: string; name: string; slug: string } | null;
}

/** GET /api/testimonials takes exactly one of these. */
export type TestimonialFilter =
  | { productId: string; comboId?: never }
  | { comboId: string; productId?: never };

export interface TestimonialListParams {
  page?: number;
  limit?: number;
}

/* ── Banners ───────────────────────────────────────────────────── */

/** A homepage slide. The storefront shows only live ones, in sortOrder. */
export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  /** Wide image; also used on phones unless mobileImage is set. */
  image: string;
  mobileImage: string | null;
  /** Set only together with ctaUrl. */
  ctaLabel: string | null;
  /** A storefront path ("/products?tag=diwali") or an http(s) URL. */
  ctaUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  /** Null = no start / no end. */
  startsAt: string | null;
  endsAt: string | null;
  /** Read-only: active and inside its schedule right now. */
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ── Inquiries ─────────────────────────────────────────────────── */

export type InquiryType = 'CUSTOM_ORDER' | 'BULK_ORDER' | 'GENERAL';

export type InquiryStatus = 'NEW' | 'IN_PROGRESS' | 'CLOSED';

/** A message from the storefront contact form. */
export interface Inquiry {
  id: string;
  type: InquiryType;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  quantity: number | null;
  status: InquiryStatus;
  /** Private to admins. */
  adminNote: string | null;
  productId: string | null;
  /** Null when none was picked or the product was deleted since. */
  product: { id: string; name: string; slug: string; images: string[] } | null;
  /** Set when the sender was signed in. */
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Newest first. */
export interface InquiryListParams {
  status?: InquiryStatus;
  type?: InquiryType;
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

/**
 * Replaced wholesale, never merged with the stored one. Sizes the shape
 * doesn't use are dropped by the API.
 */
export interface ProductMeasurementsPayload {
  shape: ProductShape;
  /** CM when left out. */
  unit?: MeasurementUnit;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  diameter?: number | null;
  note?: string | null;
}

/** `dimensions` is derived — sending it is a validation error. */
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
  colors?: ProductColor[];
  /** `null` removes the measurements (and retires any old free-text dimensions). */
  measurements?: ProductMeasurementsPayload | null;
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

/** The fields one bulk request can set; send at least one. */
export type BulkProductChanges = Partial<
  Pick<
    UpdateProductPayload,
    'isActive' | 'isFeatured' | 'isBestseller' | 'availability' | 'categoryId'
  >
>;

/** 1–100 ids; all or nothing — an unknown id fails the whole request. */
export interface BulkUpdateProductsPayload extends BulkProductChanges {
  ids: string[];
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

export interface BannerListParams {
  /** Admin only — also inactive, scheduled and ended banners. */
  includeInactive?: boolean;
}

/** Dates are ISO strings; a label needs a link, and endsAt must be after startsAt. */
export interface CreateBannerPayload {
  title: string;
  image: string;
  subtitle?: string | null;
  mobileImage?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  isActive?: boolean;
  /** Defaults to 0 — ties go to the newest banner. */
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

export type UpdateBannerPayload = Partial<CreateBannerPayload>;

export interface ReorderBannersPayload {
  items: { id: string; sortOrder: number }[];
}

/** Send at least one field; `adminNote: null` clears the note. */
export interface UpdateInquiryPayload {
  status?: InquiryStatus;
  adminNote?: string | null;
}

export interface UserListParams {
  role?: Role;
  search?: string;
  page?: number;
  limit?: number;
}
