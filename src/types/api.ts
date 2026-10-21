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

/** Whether the price covers delivery: INCLUDED = free delivery; EXTRA = charged on top. */
export type DeliveryCharge = 'INCLUDED' | 'EXTRA';

/** What shoppers are told about delivery next to a price. */
export interface Delivery {
  charge: DeliveryCharge;
  /** EXTRA only; null = quoted with the order (it depends on the address). */
  fee: number | null;
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

/** What a product's variants differ by — up to 3 options, e.g. Design × Size. */
export interface VariantOption {
  /** ≤30, unique per product ignoring case: "Design", "Size". */
  name: string;
  /** 1–30, each ≤40, unique ignoring case. */
  values: string[];
  /**
   * `{ "Geru red": "#b7410e" }` — a colour for EVERY value (or none), so
   * shoppers pick from swatches. Returned lowercase #rrggbb; absent = none.
   */
  swatches?: Record<string, string>;
}

/** One combination of option values, sold as its own thing. */
export interface ProductVariant {
  /** Stable — combos, stock alerts and buy clicks point at it. */
  id: string;
  /** Read-only: the values in option order, "Peacock / Large". */
  title: string;
  /** { Design: "Peacock" } — one listed value per option; key order means nothing. */
  options: Record<string, string>;
  /** Stored UPPERCASE; unique across all products and variants. */
  sku: string | null;
  price: number;
  /** > price when set. */
  compareAtPrice: number | null;
  /** Read-only. */
  discountPercentage: number | null;
  /** ≤6, shown instead of the product's while it's picked; [] = the product's. */
  images: string[];
  /** Its own size, for one that measures differently; null = the product's. */
  measurements: ProductMeasurements | null;
  /** Read-only: worded like the product's `dimensions`; null = the product's. */
  dimensions: string | null;
  /** ≤50; null = the product's. */
  weight: string | null;
  /** ≤300, shown under the picker while it's picked; null = nothing extra. */
  description: string | null;
  /** Its own marketplace listings; [] = the product's purchaseLinks. */
  purchaseLinks: PurchaseLink[];
  /** Its own, in place of the product's; [] = the product's. */
  highlights: string[];
  /** Null = the product's. */
  material: string | null;
  /** [] = the product's. */
  colors: ProductColor[];
  /** Null = the product's. */
  careInstructions: string | null;
  /** Shown over the product's — a label both have takes the variant's value. */
  specifications: ProductSpecification[];
  /** Null = the product's. */
  videoUrl: string | null;
  /** Its own setting; null = the product's. */
  deliveryCharge: DeliveryCharge | null;
  /** EXTRA only. */
  deliveryFee: number | null;
  /** Read-only: its own, else the product's, else the store default. */
  delivery: Delivery | null;
  /** Its own making time; both null = the product's. */
  leadTimeDays: number | null;
  leadTimeMaxDays: number | null;
  stock: number;
  /** Its own "low stock" mark; null = the store's. */
  lowStockThreshold: number | null;
  /** Read-only: in stock with its threshold or fewer left. */
  isLowStock: boolean;
  /** Read-only: the number in "Only 3 left" on the storefront, else null. */
  stockLeft: number | null;
  availability: ProductAvailability;
  /** Off = hidden from the storefront and left out of the derived figures. */
  isActive: boolean;
  /** Read-only: the order sent. */
  sortOrder: number;
  /** Read-only: "Most chosen" — only worked out on a product's own page. */
  isPopular?: boolean;
  /** Read-only: names the variant and links to it. */
  whatsappUrl: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  /** Stored UPPERCASE, unique across products and variants. */
  sku: string | null;
  shortDescription: string | null;
  description: string | null;
  highlights: string[];
  /**
   * With variants, this, compareAtPrice, stock and availability are read-only
   * — derived from the active variants: the lowest price (with its
   * compare-at), the total stock and the best availability.
   */
  price: number;
  /** MRP / strike-through; always > price when set. */
  compareAtPrice: number | null;
  /** Read-only, derived from compareAtPrice. */
  discountPercentage: number | null;
  /** [] = the product comes one way only. */
  variantOptions: VariantOption[];
  /** In order, switched-off ones included (admin requests). */
  variants: ProductVariant[];
  /** Read-only: the active variants' prices; null without variants. */
  priceRange: { min: number; max: number } | null;
  /** This product's own setting; null = follows the store default. */
  deliveryCharge: DeliveryCharge | null;
  /** EXTRA only; null = quoted with the order. */
  deliveryFee: number | null;
  /**
   * Read-only: what shoppers see — the product's own setting, else the store
   * default; null when neither says anything.
   */
  delivery: Delivery | null;
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
  /** Its own "low stock" mark, without variants; null = the store's. */
  lowStockThreshold: number | null;
  /** Read-only: low itself, or — with variants — any active variant is. */
  isLowStock: boolean;
  /** Read-only: "Only 3 left" without variants; null otherwise. */
  stockLeft: number | null;
  /** Admin-chosen; independent of stock. */
  availability: ProductAvailability;
  /** How long a made-to-order piece takes, in days; max null = one figure. */
  leadTimeDays: number | null;
  leadTimeMaxDays: number | null;
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

/** The slice of a variant a combo carries for an item that is one. */
export type ComboVariant = Pick<
  ProductVariant,
  'id' | 'title' | 'options' | 'price' | 'images' | 'availability' | 'isActive'
>;

export interface ComboItem {
  productId: string;
  /** The variant picked — set exactly when the product has variants. */
  variantId: string | null;
  /** 1–99 */
  quantity: number;
  product: ComboProduct;
  /** Its price, photo and availability stand in for the product's. */
  variant: ComboVariant | null;
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
  /** The combo's own setting, never its products'; null = follows the store default. */
  deliveryCharge: DeliveryCharge | null;
  /** EXTRA only; null = quoted with the order. */
  deliveryFee: number | null;
  /** Read-only: what shoppers see, resolved as on products. */
  delivery: Delivery | null;
  /**
   * Read-only: the least available item wins — an item is its variant's
   * availability when it has one; an inactive product or variant counts as
   * out of stock.
   */
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
  /** Product and combo testimonials together. */
  testimonials: {
    total: number;
    approved: number;
    /** Waiting for approval — the moderation queue. */
    pending: number;
    rejected: number;
    /** The approved ones' — what shoppers see; 0 when there are none. */
    avgRating: number;
    /** Authors waiting for an answer about changing their photos. */
    photoRequests: number;
  };
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

/** One variant's share of a product's demand. */
export interface VariantDemand extends BuyClickCounts {
  variantId: string;
  /** Shoppers with a stock alert on this variant. */
  waiting: number;
}

/**
 * Only from GET /api/stats/products/:id — one product's buy clicks over the
 * last `days` days and its waiting shoppers, variant by variant.
 */
export interface ProductDemand {
  days: number;
  /** All of the product's clicks — older ones without a variant included. */
  clicks: BuyClickCounts;
  /** Waiting on the product or any variant of it. */
  waiting: number;
  /** Every variant, in order — zeros included. */
  variants: VariantDemand[];
}

/**
 * Only from GET /api/stats/stock-alerts — products (and variants of them)
 * shoppers are waiting on.
 */
export interface StockAlertStats {
  /** Shoppers waiting, across all products. */
  total: number;
  /** Up to 20 rows, most wanted first — one per product, or per variant. */
  products: {
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[];
      availability: ProductAvailability;
      isActive: boolean;
    };
    /** Set when they wait for this variant. */
    variant: {
      id: string;
      title: string;
      images: string[];
      availability: ProductAvailability;
    } | null;
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
  /**
   * The default for every product and combo without its own setting;
   * null = prices say nothing about delivery.
   */
  deliveryCharge: DeliveryCharge | null;
  /** EXTRA only; null = quoted with the order. */
  deliveryFee: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  /** In stock with this many left, or fewer, is low. 5 until changed. */
  lowStockThreshold: number;
  /** "Only 3 left" on the storefront while stock is low. */
  showStockLeft: boolean;
  /** Null until first saved. */
  updatedAt: string | null;
}

/* ── Testimonials ──────────────────────────────────────────────── */

/** Only APPROVED testimonials are on the storefront. */
export type TestimonialStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PhotoRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

/** An author's request to change photos they've already added. */
export interface PhotoRequest {
  status: PhotoRequestStatus;
  reason: string | null;
  /** The admin's answer to a declined request — the author sees it. */
  note: string | null;
  requestedAt: string;
}

/** Exactly one of productId / comboId is set — the product or the combo reviewed. */
export interface Testimonial {
  id: string;
  content: string;
  /** 1–5 */
  rating: number;
  /** The author's photos, 0–4. */
  images: string[];
  userId: string;
  productId: string | null;
  comboId: string | null;
  /** The variant the author bought, when they said; null once it's gone. */
  variantId: string | null;
  variant: { id: string; title: string } | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

/** What a testimonial reviews; `image` falls back to a combo's products'. */
export interface TestimonialListing {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

/**
 * From GET /api/testimonials/all and every admin write. Exactly one of
 * product / combo is set, matching productId / comboId — never assume
 * `product` is there.
 */
export interface TestimonialWithListing extends Testimonial {
  /** An author's edit sends it back to PENDING. */
  status: TestimonialStatus;
  /** REJECTED only — the author sees it. */
  rejectionReason: string | null;
  /** When an admin last approved or rejected it. */
  moderatedAt: string | null;
  /** First in the storefront's testimonial slider. */
  isFeatured: boolean;
  /** The author has used their one chance to add photos. */
  photosLocked: boolean;
  photoRequest: PhotoRequest | null;
  product: TestimonialListing | null;
  combo: TestimonialListing | null;
}

/** Newest first; every status unless one is asked for. */
export interface TestimonialListParams {
  status?: TestimonialStatus;
  photoRequest?: PhotoRequestStatus;
  /** At most one of productId / comboId. */
  productId?: string;
  comboId?: string;
  withPhotos?: boolean;
  page?: number;
  limit?: number;
}

/** 1–100 ids, all or nothing. A reason only goes with REJECTED (≤300). */
export interface ModerateTestimonialsPayload {
  ids: string[];
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
}

/** A note only goes with DECLINED (≤300) — the author sees it. */
export interface AnswerPhotoRequestPayload {
  decision: 'APPROVED' | 'DECLINED';
  note?: string | null;
}

/* ── How we make it ────────────────────────────────────────────── */

export interface ProcessStat {
  /** ≤12, e.g. "120+" */
  value: string;
  /** ≤40, e.g. "artisans" */
  label: string;
}

/** The storefront page's own words — null fields use the storefront's copy. */
export interface ProcessPage {
  title: string | null;
  intro: string | null;
  heroImage: string | null;
  /** 0–4 headline figures. */
  stats: ProcessStat[];
  /** Null until first saved. */
  updatedAt: string | null;
}

/** One step of how a piece is made; the storefront shows active ones in order. */
export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  image: string | null;
  /** YouTube / Vimeo link, or a direct video file. */
  videoUrl: string | null;
  /** "6 months", "2–3 days" */
  duration: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Process {
  page: ProcessPage;
  /** By sortOrder. */
  steps: ProcessStep[];
}

export interface ProcessParams {
  /** Admin only — also the steps that are switched off. */
  includeInactive?: boolean;
}

/** `null` clears a field; `stats` replaces the list wholesale. */
export type UpdateProcessPagePayload = Partial<Omit<ProcessPage, 'updatedAt'>>;

/** A step without sortOrder goes last. */
export interface CreateProcessStepPayload {
  title: string;
  description: string;
  image?: string | null;
  videoUrl?: string | null;
  duration?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateProcessStepPayload = Partial<CreateProcessStepPayload>;

export interface ReorderProcessStepsPayload {
  items: { id: string; sortOrder: number }[];
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
  /** The variant the shopper was looking at; null when none, or gone since. */
  variantId: string | null;
  variant: { id: string; title: string; images: string[] } | null;
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

/**
 * The delivery pair on products, combos and Store settings. A fee needs
 * EXTRA (judged against the saved charge when only the fee is sent), and
 * moving away from EXTRA drops the saved fee. `deliveryCharge: null` hands a
 * product or combo back to the store default.
 */
export interface DeliveryPayload {
  deliveryCharge?: DeliveryCharge | null;
  deliveryFee?: number | null;
}

/** `dimensions` is derived — sending it is a validation error. */
/**
 * A variant as sent — `id` keeps an existing one; fields an existing one
 * leaves out keep their stored values.
 */
export interface ProductVariantPayload {
  id?: string;
  options: Record<string, string>;
  price: number;
  compareAtPrice?: number | null;
  sku?: string | null;
  stock?: number;
  availability?: ProductAvailability;
  images?: string[];
  /** null = measured as the product is. */
  measurements?: ProductMeasurementsPayload | null;
  /** null = weighs what the product does. */
  weight?: string | null;
  description?: string | null;
  /** [] = listed where the product is. */
  purchaseLinks?: PurchaseLink[];
  /** [] and null = the product's. */
  highlights?: string[];
  material?: string | null;
  colors?: ProductColor[];
  careInstructions?: string | null;
  specifications?: ProductSpecification[];
  videoUrl?: string | null;
  /** null = delivered as the product is. */
  deliveryCharge?: DeliveryCharge | null;
  deliveryFee?: number | null;
  leadTimeDays?: number | null;
  leadTimeMaxDays?: number | null;
  /** null = the store's. */
  lowStockThreshold?: number | null;
  isActive?: boolean;
}

/** GET /api/variants — `sort` defaults to `stock_asc`, lowest first. */
export type VariantSort =
  | 'stock_asc'
  | 'stock_desc'
  | 'name_asc'
  | 'updated_desc';

export interface VariantListParams {
  /** Product name, variant title or SKU. */
  search?: string;
  availability?: ProductAvailability;
  /** In stock with its threshold (or the store's) or fewer left. */
  lowStock?: boolean;
  isActive?: boolean;
  sort?: VariantSort;
  page?: number;
  limit?: number;
}

/** A row of GET /api/variants — every variant across products. */
export interface InventoryVariant extends ProductVariant {
  product: Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'isActive'>;
  /** Shoppers with a stock alert on it. */
  waiting: number;
  /** Combos selling it. */
  comboCount: number;
}

export interface InventoryPage extends Paginated<InventoryVariant> {
  /** Across every variant, whatever the filters. */
  counts: { all: number; lowStock: number; outOfStock: number; hidden: number };
}

/**
 * PATCH /api/products/:id/variants/:variantId — one variant changed on its
 * own; send at least one. Making it orderable emails shoppers waiting on it.
 */
export type UpdateVariantPayload = Partial<
  Pick<
    ProductVariantPayload,
    | 'price'
    | 'compareAtPrice'
    | 'stock'
    | 'availability'
    | 'isActive'
    | 'lowStockThreshold'
  > & {
    /** Added to the stock as it is when saved — never with `stock`. */
    addStock: number;
  }
>;

export interface CreateProductPayload extends DeliveryPayload {
  name: string;
  /** Required without variants; with them it's derived and ignored. */
  price?: number;
  categoryId: string;
  /**
   * Sent together, each time the whole list — a stored variant left out is
   * deleted. [] for both turns the product back into a single one.
   */
  variantOptions?: VariantOption[];
  variants?: ProductVariantPayload[];
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
  /** null = the store's. */
  lowStockThreshold?: number | null;
  availability?: ProductAvailability;
  leadTimeDays?: number | null;
  leadTimeMaxDays?: number | null;
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
  /** Required for a product with variants, refused for one without. */
  variantId?: string | null;
  quantity?: number;
}

export interface CreateComboPayload extends DeliveryPayload {
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

export interface UpdateSettingsPayload extends DeliveryPayload {
  whatsappNumber?: string | null;
  whatsappMessageTemplate?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  lowStockThreshold?: number;
  showStockLeft?: boolean;
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

/* ── Costing ───────────────────────────────────────────────────── */

/** What a raw material is counted in — purchases and cost sheets alike. */
export type MaterialUnit =
  | 'PIECE'
  | 'PAIR'
  | 'SET'
  | 'PACKET'
  | 'SHEET'
  | 'ROLL'
  | 'METRE'
  | 'CENTIMETRE'
  | 'GRAM'
  | 'KILOGRAM'
  | 'MILLILITRE'
  | 'LITRE';

/** A cost sheet line: a raw material used up, or money spent per batch. */
export type CostLineType =
  | 'MATERIAL'
  | 'LABOUR'
  | 'PACKAGING'
  | 'DELIVERY'
  | 'OVERHEAD'
  | 'OTHER';

/** Where an order came from. OFFLINE = a shop, an exhibition, a mela. */
export type SaleChannel =
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'AMAZON'
  | 'FLIPKART'
  | 'MEESHO'
  | 'ETSY'
  | 'WEBSITE'
  | 'OFFLINE'
  | 'OTHER';

/**
 * A listing's price against its cost. NO_COST has no cost sheet to judge
 * by; BELOW_TARGET is under the costing settings' target margin.
 */
export type CostingStatus = 'NO_COST' | 'LOSS' | 'BELOW_TARGET' | 'HEALTHY';

export interface RawMaterial {
  id: string;
  name: string;
  /** Free grouping — "Base", "Paint", "Decoration". */
  category: string | null;
  unit: MaterialUnit;
  /** What one unit costs now, up to 4 decimals (₹0.4 a ml). */
  unitCost: number;
  supplier: string | null;
  notes: string | null;
  /** Off = kept for the sheets using it, but not offered for new lines. */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPurchase {
  id: string;
  materialId: string;
  /** In the material's unit. */
  quantity: number;
  totalCost: number;
  /** Read-only: totalCost / quantity. */
  unitCost: number;
  supplier: string | null;
  note: string | null;
  purchasedAt: string;
  createdAt: string;
}

/** A row of GET /api/costing/materials. */
export interface RawMaterialListItem extends RawMaterial {
  /** Cost sheets that use it. */
  usageCount: number;
  lastPurchase: Pick<MaterialPurchase, 'purchasedAt' | 'unitCost'> | null;
  /** The latest price against the one before, in %; null with fewer than two. */
  priceChangePercent: number | null;
}

export interface MaterialsPage extends Paginated<RawMaterialListItem> {
  /** Every category in use. */
  categories: string[];
}

export type MaterialSort = 'name_asc' | 'cost_desc' | 'updated_desc';

export interface MaterialListParams {
  /** Name, category or supplier. */
  search?: string;
  category?: string;
  isActive?: boolean;
  sort?: MaterialSort;
  page?: number;
  limit?: number;
}

/** What a cost sheet is for — a product, a variant of one, or a combo. */
export interface CostSheetTarget {
  kind: 'PRODUCT' | 'VARIANT' | 'COMBO';
  productId: string | null;
  variantId: string | null;
  comboId: string | null;
  /** "Karwa Chauth Thali — Peacock" */
  name: string;
  /** The product's or combo's. */
  slug: string;
}

export interface MaterialUsage {
  sheetId: string;
  target: CostSheetTarget;
  /** Per batch, wastage left out. */
  quantity: number;
  batchSize: number;
  /** What it adds to one piece, wastage included. */
  costPerPiece: number;
}

/** From GET /api/costing/materials/:id and every purchase write. */
export interface RawMaterialDetail extends RawMaterialListItem {
  /** Newest first, up to 100. */
  purchases: MaterialPurchase[];
  usage: MaterialUsage[];
}

export interface CreateMaterialPayload {
  name: string;
  category?: string | null;
  unit: MaterialUnit;
  unitCost: number;
  supplier?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export type UpdateMaterialPayload = Partial<CreateMaterialPayload>;

export interface RecordPurchasePayload {
  quantity: number;
  totalCost: number;
  supplier?: string | null;
  note?: string | null;
  /** ISO; now when left out. */
  purchasedAt?: string;
  /** On unless false — an old bill entered late shouldn't set today's cost. */
  updateUnitCost?: boolean;
}

/** A batch's or one piece's costs, by type of cost and in all. */
export type CostBreakdown = Record<CostLineType, number> & { total: number };

export interface CostLine {
  id: string;
  type: CostLineType;
  materialId: string | null;
  material: Pick<
    RawMaterial,
    'id' | 'name' | 'unit' | 'unitCost' | 'isActive'
  > | null;
  /** MATERIAL — per batch. */
  quantity: number | null;
  wastagePercent: number;
  /** Every other type — and an optional note on a material line. */
  label: string | null;
  /** Every other type — per batch. */
  amount: number | null;
  /** Read-only: what the line costs the batch. */
  cost: number;
}

export interface CostSheet {
  id: string;
  /** The pieces the lines make. */
  batchSize: number;
  notes: string | null;
  lines: CostLine[];
  batchCost: CostBreakdown;
  /** One piece: batchCost / batchSize. */
  unitCost: CostBreakdown;
  updatedAt: string;
}

export interface CostLinePayload {
  type: CostLineType;
  materialId?: string | null;
  quantity?: number | null;
  wastagePercent?: number;
  label?: string | null;
  amount?: number | null;
}

/** The whole sheet, each time — exactly one of the three targets. */
export interface SaveCostSheetPayload {
  productId?: string;
  variantId?: string;
  comboId?: string;
  batchSize?: number;
  notes?: string | null;
  lines: CostLinePayload[];
}

/** What a channel keeps of a sale — "15% + ₹20". */
export interface ChannelFee {
  channel: SaleChannel;
  percent: number;
  fixed: number;
}

export interface CostingSettings {
  /** A channel left out keeps nothing. */
  channelFees: ChannelFee[];
  targetMarginPercent: number | null;
  /** GST (or another tax) included in prices. */
  taxPercent: number | null;
  updatedAt: string | null;
}

export type UpdateCostingSettingsPayload = Partial<
  Omit<CostingSettings, 'updatedAt'>
>;

/** What one piece sold on a channel leaves the store. */
export interface ChannelProfit {
  channel: SaleChannel;
  price: number;
  /** What the buyer pays for delivery on top. */
  deliveryCharged: number;
  tax: number;
  channelFee: number;
  cost: number;
  profit: number;
  /** Of what's left after tax; null when that's nothing. */
  marginPercent: number | null;
}

/** OWN sheet, the PRODUCT's (a variant without one), or its ITEMS' (a combo). */
export type CostSource = 'OWN' | 'PRODUCT' | 'ITEMS';

export interface PriceAnalysis {
  unitCost: number | null;
  costSource: CostSource | null;
  breakdown: CostBreakdown | null;
  /** Every channel; empty without a cost. */
  byChannel: ChannelProfit[];
  /** On WhatsApp: the price reaching the target margin, and break-even. */
  suggestedPrice: number | null;
  breakEvenPrice: number | null;
  status: CostingStatus;
}

export interface ProductCosting {
  product: Pick<
    Product,
    'id' | 'name' | 'slug' | 'images' | 'price' | 'isActive' | 'delivery'
  > & { hasVariants: boolean };
  sheet: CostSheet | null;
  /** Without variants. */
  analysis: PriceAnalysis | null;
  variants: {
    variant: Pick<
      ProductVariant,
      'id' | 'title' | 'price' | 'images' | 'isActive' | 'delivery'
    >;
    /** Its own; without one it costs the product's. */
    sheet: CostSheet | null;
    analysis: PriceAnalysis;
  }[];
  settings: CostingSettings;
}

export interface ComboCosting {
  combo: Pick<
    Combo,
    'id' | 'name' | 'slug' | 'images' | 'price' | 'isActive' | 'delivery'
  >;
  items: {
    name: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    unitCost: number | null;
    costSource: CostSource | null;
  }[];
  /** Null while an item has no cost. */
  itemsCost: number | null;
  /** The combo's own extras — the box, the ribbon. */
  sheet: CostSheet | null;
  analysis: PriceAnalysis;
  settings: CostingSettings;
}

/** A row of GET /api/costing/listings. */
export interface CostedListing {
  kind: CostSheetTarget['kind'];
  productId: string | null;
  variantId: string | null;
  comboId: string | null;
  name: string;
  variantTitle: string | null;
  slug: string;
  image: string | null;
  sku: string | null;
  price: number;
  isActive: boolean;
  unitCost: number | null;
  costSource: CostSource | null;
  /** One piece, on the channel asked for. */
  profit: number | null;
  marginPercent: number | null;
  suggestedPrice: number | null;
  status: CostingStatus;
}

export type CostedListingSort =
  | 'margin_asc'
  | 'margin_desc'
  | 'profit_desc'
  | 'cost_desc'
  | 'name_asc';

export interface CostedListingParams {
  search?: string;
  kind?: CostSheetTarget['kind'];
  status?: CostingStatus;
  channel?: SaleChannel;
  sort?: CostedListingSort;
  page?: number;
  limit?: number;
}

export interface CostedListingsPage extends Paginated<CostedListing> {
  channel: SaleChannel;
  /** Across every listing, whatever the filters. */
  counts: Record<CostingStatus | 'all', number>;
}

export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  productId: string | null;
  variantId: string | null;
  comboId: string | null;
  /** What it links to now — null once deleted; the name stays. */
  product: { id: string; name: string; slug: string; images: string[] } | null;
  variant: { id: string; title: string; images: string[] } | null;
  combo: { id: string; name: string; slug: string; images: string[] } | null;
}

/** Always worked out on read. */
export interface SaleTotals {
  units: number;
  itemsTotal: number;
  discount: number;
  deliveryCharged: number;
  /** What buyers paid. */
  revenue: number;
  tax: number;
  netRevenue: number;
  costOfGoods: number;
  deliveryCost: number;
  channelFee: number;
  otherCost: number;
  profit: number;
  marginPercent: number | null;
}

export interface Sale {
  id: string;
  soldAt: string;
  channel: SaleChannel;
  customerName: string | null;
  customerPhone: string | null;
  deliveryCharged: number;
  deliveryCost: number;
  discount: number;
  channelFee: number;
  tax: number;
  otherCost: number;
  note: string | null;
  /** Whether saving it took anything out of stock. */
  stockDeducted: boolean;
  items: SaleItem[];
  totals: SaleTotals;
  createdAt: string;
  updatedAt: string;
}

/**
 * A product (with its variant), a combo, or a custom piece. A name, price or
 * cost left out is taken from what was sold; a custom piece needs a name and
 * a price.
 */
export interface SaleItemPayload {
  productId?: string | null;
  variantId?: string | null;
  comboId?: string | null;
  name?: string;
  quantity: number;
  unitPrice?: number;
  unitCost?: number;
}

export interface CreateSalePayload {
  /** ISO; now when left out. */
  soldAt?: string;
  channel: SaleChannel;
  customerName?: string | null;
  customerPhone?: string | null;
  items: SaleItemPayload[];
  deliveryCharged?: number;
  deliveryCost?: number;
  discount?: number;
  /** Left out, worked out from the costing settings. */
  channelFee?: number;
  tax?: number;
  otherCost?: number;
  note?: string | null;
  /** Take what was sold out of stock — a combo's items, for a combo. */
  deductStock?: boolean;
}

/** A field left out keeps its value; items, when sent, replace the list. */
export type UpdateSalePayload = Partial<CreateSalePayload>;

export interface SaleListParams {
  /** "2026-10-05" — that whole IST day. */
  from?: string;
  to?: string;
  channel?: SaleChannel;
  /** Customer, phone, note or an item's name. */
  search?: string;
  page?: number;
  limit?: number;
}

export interface SalesPage extends Paginated<Sale> {
  /** Every sale the filters match, not only this page. */
  summary: SaleTotals & { sales: number };
}

export interface ProfitReportParams {
  from?: string;
  to?: string;
}

export interface ProfitReport {
  from: string;
  to: string;
  granularity: 'day' | 'month';
  totals: SaleTotals & {
    sales: number;
    averageOrderValue: number | null;
    materialSpend: number;
  };
  /** Oldest first, zero-filled. */
  series: {
    period: string;
    sales: number;
    revenue: number;
    costs: number;
    profit: number;
  }[];
  byChannel: {
    channel: SaleChannel;
    sales: number;
    revenue: number;
    profit: number;
    marginPercent: number | null;
  }[];
  /** By gross profit — price less cost, before the order's discount and fees. */
  topItems: {
    name: string;
    productId: string | null;
    variantId: string | null;
    comboId: string | null;
    units: number;
    revenue: number;
    grossProfit: number;
    marginPercent: number | null;
  }[];
  materialSpend: {
    materialId: string;
    name: string;
    unit: MaterialUnit;
    quantity: number;
    spent: number;
  }[];
}
