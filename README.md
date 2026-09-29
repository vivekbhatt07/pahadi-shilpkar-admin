# link-vault-admin

Admin panel for the **Pahadi Shilpkar** storefront: categories, products (with bulk actions and duplicate), combos, testimonial moderation, customers, store settings, and the admin's own account.

The dashboard shows catalog counts plus two demand signals from the storefront: **buying interest** (clicks on "Order on WhatsApp" and marketplace links, `GET /api/stats/buy-clicks`) and **waiting for restock** (products shoppers asked to be emailed about, `GET /api/stats/stock-alerts`). Saving a product as In stock or Made to order emails everyone waiting on it.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL (see .env.development / .env.production)
npm run dev            # http://localhost:5174
```

The backend allows the storefront (`CLIENT_URL`) and this panel (`ADMIN_URL`) through CORS. Run this panel on `http://localhost:5174` locally, matching the backend's `ADMIN_URL`; the port is pinned in `vite.config.ts` so it never collides with `link-vault-fe` on 5173.

Optional: set `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` to enable direct browser uploads on image fields. Without them, image fields accept pasted URLs only (the backend has no upload endpoint).

## Structure

```
src/
  api/            axios client + central 401/403/429 + validation-error parsing
  api/services/   one module per backend resource (auth, categories, combos, products, settings, stats, testimonials, upload, users)
  hooks/          TanStack Query hooks per resource (queries, mutations, optimistic toggles)
  types/api.ts    backend contract types (mirrors the API exactly)
  helpers/        form error mapping, formatting, optional image upload
  components/     ui (shadcn-style primitives), custom (composite), dialogs, layouts
  pages/          private (dashboard, categories, products, settings) and public (auth)
  store/          zustand stores (auth, appearance, sidebar, rate limit)
```
