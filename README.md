# pahadi-shilpkar-admin

Admin panel for the **Pahadi Shilpkar** storefront: categories, products (with bulk actions and duplicate), combos, homepage banners, the inquiry inbox, testimonial moderation, customers, store settings, and the admin's own account.

The dashboard shows catalog counts plus two demand signals from the storefront: **buying interest** (clicks on "Order on WhatsApp" and marketplace links, `GET /api/stats/buy-clicks`, charted per day with a table view) and **waiting for restock** (products shoppers asked to be emailed about, `GET /api/stats/stock-alerts`). Saving a product as In stock or Made to order emails everyone waiting on it. When an email or a cleanup still fails after five tries, the dashboard says so and lists it to try again or dismiss (`/api/jobs`).

- **Banners** (`/banners`) — the slides above the storefront's home hero (`/api/banners`). Drag to reorder, switch on and off, and schedule a start and end; each row says whether it is live, scheduled, ended or hidden. New banners go first.
- **Delivery charges** — whether a price covers delivery: free, or charged extra at an optional fixed fee (left blank when it depends on the address and is quoted on WhatsApp). Set the default for everything in Store settings; any product or combo can set its own in its Pricing card. The storefront shows it under the price ("Free delivery", "+ ₹80 delivery", "Excluding delivery charges"), and the forms preview exactly that.
- **Variants** — a product sold in several designs, sizes or colours (the Variants card of the product form). Each combination of option values is a variant with its own price, stock, availability, photos (shown on the storefront instead of the product's) and, when it differs, size and weight. Drag values to reorder them and move options up or down; turn on swatches to show an option's values as colours; add back a removed combination; generate SKUs from a prefix; edit price, compare-at price, stock, availability or visibility for every variant or only those with one value ("every Large"); copy a variant's photos — or its size and weight — to the others that share a value; and give a variant a description and marketplace links of its own. The editor marks variants that combos sell and warns before a save that would remove one. The product page shows each variant's stock (flagging in-stock ones with few or none left), its buy clicks over 30 days and the shoppers waiting on it (`GET /api/stats/products/:id`), previews its photos, and has a quick edit for restocks and price changes (`PATCH /api/products/:id/variants/:variantId`). The products list flags sold-out variants of products still in stock.
- **Variants page** (`/variants`) — every variant across products (`GET /api/variants`), lowest stock first: filter by low stock, sold out or hidden, search by product, variant or SKU, see who's waiting and which combos sell each one, preview it, and quick-edit its stock or price.
- **Combo items** — each item in the combo form shows its photo large; its preview shows exactly what shoppers will see for it (the variant's photos, options, price, stock, and anything that would hide the combo or make it unavailable) and can swap the item to another design of the same product in place. Adding a product with variants shows the design under the pointer large before it's added. The combo page previews its items the same way.
- **Photo storage** (`/settings/storage`) — the store's Cloudinary account (free plan: 25 credits a month): this month's credits, transformations, storage and bandwidth (`GET /api/storage/usage`; the dashboard warns from 80%), and the photos uploaded in forms that were never saved, to select and delete (`/api/storage/unused-images`). Photos everywhere in the panel are shown through the storefront's own resized copies (`src/helpers/image.ts` — keep it in step with the storefront's `src/lib/image.ts`), never the originals.
- **Inquiries** (`/inquiries`) — messages from the storefront contact form (`/api/inquiries`): custom pieces, bulk and gifting orders, questions. Filter by status and type, reply by email, phone or WhatsApp, move an inquiry from New to In progress to Closed, and keep a private note. The sidebar and dashboard show how many are still new. Each new inquiry is also emailed to the store's contact email when one is set in Store settings.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL (see .env.development / .env.production)
npm run dev            # http://localhost:5174
```

The backend allows the storefront (`CLIENT_URL`) and this panel (`ADMIN_URL`) through CORS. Run this panel on `http://localhost:5174` locally, matching the backend's `ADMIN_URL`; the port is pinned in `vite.config.ts` so it never collides with `pahadi-shilpkar-fe` on 5173.

Image fields upload through the backend (`POST /api/upload/images`, `/avatar`), which needs Cloudinary configured on the server. When it isn't (the endpoint answers 503), paste an image URL instead. Every photo but a GIF is re-encoded in the browser before it's sent — no larger than 2000px, without its metadata (the camera's location among it), and under 2MB.

## Scripts

| Script               | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Vite dev server                                |
| `npm run build`      | Type-check (`tsc -b`) + production build       |
| `npm run lint`       | ESLint                                         |
| `npm test`           | Vitest + Testing Library (jsdom), once         |
| `npm run test:watch` | The same, re-running on change                 |
| `npm run format`     | Prettier                                       |

CI (`.github/workflows/ci.yml`) checks formatting and runs lint, tests and the build on every push and pull request to `main` and `develop`.

Every page except sign-in loads on demand (`src/routes/pages.ts`); once signed in, the rest are fetched while the browser is idle, so navigating never waits. A page that crashes shows an error inside the layout — the sidebar keeps working — and after a deploy a stale tab is asked to reload.

## Structure

```
src/
  api/            axios client + central 401/403/429 + validation-error parsing
  api/services/   one module per backend resource (auth, banners, categories, combos, inquiries, products, settings, stats, testimonials, upload, users)
  hooks/          TanStack Query hooks per resource (queries, mutations, optimistic toggles)
  types/api.ts    backend contract types (mirrors the API exactly)
  helpers/        form error mapping, formatting, optional image upload
  components/     ui (shadcn-style primitives), custom (composite), dialogs, layouts
  pages/          private (dashboard, categories, products, combos, banners, inquiries, testimonials, customers, settings) and public (auth)
  store/          zustand stores (auth, appearance, sidebar, rate limit)
```
