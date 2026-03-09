# Active Context: ProCatalogue App

## Current State

**App Status**: ✅ Fully functional Product Catalogue + Ordering + Inventory Management App

The app is a complete procurement platform built on Next.js 16 with SQLite database.

## Recently Completed

- [x] Full product catalogue with public browsing (prices hidden for guests)
- [x] 3-step business registration with admin approval workflow
- [x] Customer portal: cart, orders, messaging, inventory management
- [x] Admin dashboard: clean UI with stats, quick actions, recent activity
- [x] Admin product management (add/edit/toggle stock/hide products)
- [x] Admin order review with editable quantities/prices + invoice generation
- [x] Admin registration approval (approve/reject customers)
- [x] Delivery confirmation flow with auto inventory update
- [x] Customer inventory tracking with low stock alerts
- [x] SQLite database via @libsql/client with full schema
- [x] JWT authentication with role-based access control
- [x] 12 sample products across 4 categories seeded
- [x] Demo admin: admin@example.com / admin123

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Landing page with hero, features, CTA | ✅ Done |
| `src/app/catalogue/` | Public product catalogue with search/filter | ✅ Done |
| `src/app/login/` | Login page | ✅ Done |
| `src/app/register/` | 3-step business registration | ✅ Done |
| `src/app/pending-approval/` | Waiting for admin approval page | ✅ Done |
| `src/app/portal/` | Customer portal (dashboard, cart, orders, inventory) | ✅ Done |
| `src/app/admin/` | Admin panel (dashboard, products, orders, registrations) | ✅ Done |
| `src/app/api/` | All API routes | ✅ Done |
| `src/db/` | Database schema, migrations, seed data | ✅ Done |
| `src/lib/` | Auth utilities, helper functions | ✅ Done |
| `src/components/` | UI components (Button, Card, Badge, Input, etc.) | ✅ Done |
| `data/app.db` | SQLite database file | ✅ Created |

## User Roles & Access

| Role | Access |
|------|--------|
| Public (no login) | Browse catalogue, view products, mark interest |
| Pending Customer | Browse catalogue only |
| Approved Customer | Full portal: prices, cart, orders, inventory |
| Admin | Full admin panel + all customer features |

## Demo Credentials

- **Admin**: admin@example.com / admin123
- **Register** a new business at `/register` to test customer flow

## Key Workflows

1. **Public browsing** → `/catalogue` (no prices shown)
2. **Register** → `/register` (3-step form, admin approval required)
3. **Admin approves** → `/admin/registrations`
4. **Customer orders** → `/portal/cart` → submit order
5. **Admin reviews** → `/admin/orders/[id]` (edit qty/price, generate invoice)
6. **Customer confirms delivery** → `/portal/orders/[id]`
7. **Inventory auto-updates** after delivery confirmation

## Session History

| Date | Changes |
|------|---------|
| 2024 | Initial template created |
| 2024 | Complete ProCatalogue app built from scratch |
