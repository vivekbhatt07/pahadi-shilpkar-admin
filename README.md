# link-vault-admin

Admin panel for the **Pahadi Shilpkar** storefront: categories, products (with bulk actions and duplicate), combos, homepage banners, the inquiry inbox, testimonial moderation, customers, store settings, and the admin's own account.

The dashboard shows catalog counts plus two demand signals from the storefront: **buying interest** (clicks on "Order on WhatsApp" and marketplace links, `GET /api/stats/buy-clicks`, charted per day with a table view) and **waiting for restock** (products shoppers asked to be emailed about, `GET /api/stats/stock-alerts`). Saving a product as In stock or Made to order emails everyone waiting on it.

- **Banners** (`/banners`) — the slides above the storefront's home hero (`/api/banners`). Drag to reorder, switch on and off, and schedule a start and end; each row says whether it is live, scheduled, ended or hidden. New banners go first.
- **Inquiries** (`/inquiries`) — messages from the storefront contact form (`/api/inquiries`): custom pieces, bulk and gifting orders, questions. Filter by status and type, reply by email, phone or WhatsApp, move an inquiry from New to In progress to Closed, and keep a private note. The sidebar and dashboard show how many are still new. Each new inquiry is also emailed to the store's contact email when one is set in Store settings.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL (see .env.development / .env.production)
npm run dev            # http://localhost:5174
```

The backend allows the storefront (`CLIENT_URL`) and this panel (`ADMIN_URL`) through CORS. Run this panel on `http://localhost:5174` locally, matching the backend's `ADMIN_URL`; the port is pinned in `vite.config.ts` so it never collides with `link-vault-fe` on 5173.

Image fields upload through the backend (`POST /api/upload/images`, `/avatar`), which needs Cloudinary configured on the server. When it isn't (the endpoint answers 503), paste an image URL instead.

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
