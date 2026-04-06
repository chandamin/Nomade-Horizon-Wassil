# Handover Document — Nomade Horizon (Ascend)

**Project:** Ascend — Subscriptions at Convenience
**Author:** KasWebtech
**Date:** 2026-04-06
**Status:** In development — admin panel functional, checkout functional, subscription lifecycle management operational

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [Backend — Routes & Endpoints](#5-backend--routes--endpoints)
6. [Backend — Data Models](#6-backend--data-models)
7. [Backend — Middleware](#7-backend--middleware)
8. [Backend — Services & Libraries](#8-backend--services--libraries)
9. [Frontend — Pages](#9-frontend--pages)
10. [Frontend — Components](#10-frontend--components)
11. [Frontend — Auth Utilities](#11-frontend--auth-utilities)
12. [Key Data Flows](#12-key-data-flows)
13. [Running the Project](#13-running-the-project)
14. [Known Issues & Remaining Work](#14-known-issues--remaining-work)
15. [Deployment Notes](#15-deployment-notes)

---

## 1. Project Overview

Ascend is a **subscription management system** built as a BigCommerce app. It allows:

- **Customers** to subscribe to products at checkout (payment processed via Airwallex)
- **Admins** to manage subscriptions, selling plans, and customer data through a protected admin dashboard

The system bridges three external platforms:
- **BigCommerce** — e-commerce store, customer records, orders, cart management
- **Airwallex** — payment processing, recurring billing, subscription engine
- **MongoDB Atlas** — persistent data store for subscriptions, customers, plans

### Key Capabilities
- Multi-subscription product support (dynamically loaded from DB, not hardcoded)
- Coupon and discount application/removal during checkout
- Shipping quote fetching via BigCommerce Consignments API
- VIP product add/remove toggle at checkout
- Subscription cancellation with proration control (ALL / PRORATED / NONE)
- Subscription editing (collection method, payment source, trial period)
- Sync subscription state from Airwallex to local DB
- Admin credential update (username + password)
- Environment toggle (Sandbox ↔ Live) for plan management *(currently commented out in Sidebar UI)*

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js + Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) + bcrypt 6 |
| Rate limiting | `express-rate-limit` |
| HTTP client (backend) | `axios` |
| Frontend | React 19 + React Router 7 + Vite 7 |
| Styling | Tailwind CSS 3 + custom checkout CSS (Montserrat font) |
| Payment UI | `@airwallex/components-sdk` |
| Payment API (backend) | `axios` (direct Airwallex REST calls) |
| E-commerce | BigCommerce Management API (v2 + v3) via `fetch` |
| Date handling | `dayjs` |
| Icons | `lucide-react` |
| Toggle | `react-switch` |

---

## 3. Repository Structure

```
Nomade-Subscription/
├── ReadMe.md                              (dev notes / code snippets)
├── Hande_Over.md                          (this document)
│
├── backend/
│   ├── index.js                           (server entry — middleware, routes, port)
│   ├── package.json
│   ├── .env                               (secrets — never commit)
│   ├── app.log                            (runtime log file, auto-generated)
│   │
│   ├── db/
│   │   └── mongo.js                       (Mongoose connection)
│   │
│   ├── middleware/
│   │   ├── requireSession.js              (JWT validation — protects admin routes)
│   │   └── verifyWebhook.js               (BigCommerce SHA1 signature check)
│   │
│   ├── models/
│   │   ├── AdminUser.js
│   │   ├── BillingCustomer.js
│   │   ├── CustomerSubscription.js
│   │   ├── Store.js
│   │   ├── Subscriber.js
│   │   ├── Subscription.js
│   │   ├── SubscriptionCustomer.js
│   │   └── SubscriptionPlan.js
│   │
│   ├── routes/
│   │   ├── adminAuth.js                   (login + /me + update credentials)
│   │   ├── admin.js                       (store summary, subscribers)
│   │   ├── airwallexLivePlan.js           (LIVE plan CRUD + checkout endpoints)
│   │   ├── airwallexTestPlan.js           (SANDBOX plan CRUD + checkout endpoints)
│   │   ├── auth.js                        (BigCommerce OAuth install/load/uninstall)
│   │   ├── bigcommerceRoutes.js           (cart, customers, orders, shipping, coupons, discounts, VIP)
│   │   ├── dashboard.js                   (admin dashboard stats)
│   │   ├── sellingPlans.js                (selling plan DB CRUD — legacy, not actively used)
│   │   ├── subscriptions.js               (admin subscription management)
│   │   ├── syncOrders.js                  (order sync utility — placeholder)
│   │   ├── webhooks.js                    (BC webhook receivers)
│   │   └── backfill-subscription-emails.js (one-off migration script)
│   │
│   ├── services/
│   │   ├── airwallex.js
│   │   ├── airwallexAuth.js
│   │   ├── airwallexClient.js
│   │   ├── airwallexSellingPlans.js
│   │   ├── bigcommerceOrders.js
│   │   └── registerWebhooks.js
│   │
│   ├── lib/
│   │   ├── subscriptionProducts.js        (shared helpers: enabled plan IDs, cart product matching)
│   │   └── airwallex/
│   │       ├── client.js
│   │       ├── price.js
│   │       ├── product.js
│   │       ├── subscriptionAdmin.js       (cancel, update, sync, upsert projection)
│   │       ├── subscriptionPlan.js
│   │       └── token.js                   (fetch/cache Airwallex access tokens)
│   │
│   └── scripts/
│       ├── createAdmin.js                 (one-time: seed initial admin user)
│       ├── seedSubscriptions.js
│       └── migrateSubscriptionPlanProductIds.js
│
└── frontend/
    ├── package.json
    ├── .env
    ├── vite.config.mjs
    ├── tailwind.config.cjs
    ├── postcss.config.cjs
    ├── index.html
    ├── deploy_frontend.sh                 (deployment script)
    │
    └── src/
        ├── App.jsx                        (router, layout, environment state)
        ├── index.jsx
        ├── index.css
        ├── App.css
        │
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Subscriptions.jsx
        │   ├── SellingPlans.jsx
        │   ├── CreatePlan.jsx
        │   ├── Checkout.jsx
        │   ├── ThankYou.jsx
        │   ├── AdminSettings.jsx
        │   └── Customers.jsx              (placeholder — unused)
        │
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── Checkout/
        │       ├── CheckoutLayout.jsx
        │       ├── ClientStep.jsx
        │       ├── ShippingStep.jsx
        │       ├── PaymentStep.jsx
        │       ├── OrderSummary.jsx
        │       └── ThankYouStep.jsx
        │
        ├── utils/
        │   └── auth.js                    (token helpers, authHeaders, handleUnauthorized)
        │
        ├── api/
        │   └── admin.js
        │
        ├── mocks/
        │   └── dashboardMock.js
        │
        └── styles/
            └── checkout.css               (custom checkout styling — Montserrat font)
```

---

## 4. Environment Variables

### Backend (`backend/.env`)

```env
PORT=4000
APP_SESSION_SECRET=<long hex string used to sign JWTs>

# BigCommerce OAuth
BIGCOMMERCE_CLIENT_ID=
BIGCOMMERCE_CLIENT_SECRET=
BIGCOMMERCE_REDIRECT_URI=

# URLs
APP_URL=                           # backend public URL
FRONTEND_URL=                      # frontend public URL
BACKEND_URL=                       # backend public URL (same as APP_URL)
FRONTEND_CHECKOUT_URL=             # checkout page URL (auto-derived from FRONTEND_URL if not set)

# Airwallex — Sandbox
AIRWALLEX_API_KEY=
AIRWALLEX_CLIENT_ID=
AIRWALLEX_ENV=sandbox
AIRWALLEX_BASE_URL=https://api-demo.airwallex.com
AIRWALLEX_LEGAL_ENTITY_ID=
AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID=

# Airwallex — Live
AIRWALLEX_LIVE_API_KEY=
AIRWALLEX_LIVE_CLIENT_ID=
AIRWALLEX_LIVE_BASE_URL=https://api-demo.airwallex.com

# MongoDB
MONGO_URI=mongodb+srv://...

# BigCommerce direct API
BC_API_TOKEN=
```

### Frontend (`frontend/.env`)

```env
VITE_BACKEND_URL=https://apicheckout.nomade-horizon.com
VITE_SUBSCRIPTION_PRODUCT_IDS=<comma-separated BigCommerce product IDs — used as fallback only>
```

> **Note:** The frontend now dynamically loads enabled subscription product IDs from the backend via `GET /api/subscription-plans/public/enabled-product-ids`. The `VITE_SUBSCRIPTION_PRODUCT_IDS` env var is only a fallback if that call fails.

---

## 5. Backend — Routes & Endpoints

### Route mount map (`index.js`)

```
PUBLIC — no auth required
  /api/admin-auth          → adminAuth.js
  /api/webhooks            → webhooks.js
  /api                     → auth.js          (BC OAuth)
  /api                     → bigcommerceRoutes.js

PARTIAL AUTH — plan CRUD protected inside the router, checkout endpoints public
  /api/selling-plans       → airwallexLivePlan.js
  /api/subscription-plans  → airwallexTestPlan.js

FULLY PROTECTED — requireSession applied at mount
  /api/admin               → admin.js
  /api/dashboard           → dashboard.js
  /api/subscriptions       → subscriptions.js
  /api/sync-orders         → syncOrders.js

UTILITY
  GET /api/health          → inline health check
```

---

### `adminAuth.js` — Admin Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin-auth/login` | None (rate-limited: 10/15min) | Validates username + password, returns signed JWT (8h expiry) |
| GET | `/api/admin-auth/me` | JWT required | Returns `{ username, role }` of current token |
| PUT | `/api/admin-auth/update-credentials` | JWT required | Update admin username and/or password. Requires current password for verification. |

**Login response:**
```json
{ "token": "<jwt>", "username": "admin", "role": "admin" }
```

---

### `bigcommerceRoutes.js` — BigCommerce Integration

This is the largest route file. It handles cart operations, customer management, shipping, orders, coupons/discounts, and VIP product toggling.

#### Cart Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cart` | Fetch cart from BC by `?cartId=`, transform, and **redirect** to frontend checkout with cart data in URL params |
| GET | `/api/cart-data` | Fetch cart from BC by `?cartId=` and return transformed JSON (no redirect) |
| PUT | `/api/cart/assign-customer` | Assign a BC customer to an existing cart. Body: `{ cartId, customerId }` |
| DELETE | `/api/cart/:cartId` | Delete (clear) a cart in BigCommerce |

#### Customer Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/customers` | Create new BC customer. Auto-generates password. Falls back to lookup if email already exists (422 handling) |
| GET | `/api/customers/search` | Search BC customer by `?email=`. Returns `{ exists, customer }` |
| POST | `/api/customer/address` | Save or update a customer's residential address in BC (v2 API). Finds existing address to update, or creates new one |

#### Shipping

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shipping/zones` | List all BC shipping zones |
| GET | `/api/shipping/zones/:zoneId/methods` | List shipping methods for a zone |
| POST | `/api/shipping/quotes` | **Primary shipping endpoint.** Creates a consignment on the checkout with the given address, returns available shipping options. Body: `{ cartId, address }` |

#### Order Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders/create` | Create order in BigCommerce. **Prices are fetched server-side from BC catalog — client-supplied prices are ignored.** Handles: order status update on Airwallex payment success, inventory decrement, email notification placeholder |
| GET | `/api/orders/:orderId` | Get order details from BC |

#### Coupon & Discount Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/checkout/coupons/apply` | Apply a coupon code to a checkout. Body: `{ cartId, couponCode }`. Returns refreshed cart data |
| DELETE | `/api/checkout/coupons/:cartId/:couponCode` | Remove a coupon from checkout. Returns refreshed cart data |
| POST | `/api/checkout/discounts/apply` | Apply a discount object to checkout. Body: `{ cartId, discount }` |
| DELETE | `/api/checkout/discounts/:cartId` | Remove all discounts from checkout |

#### VIP Product Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/cart/add-vip` | Add VIP product (ID: 268) to cart. Checks for duplicates first. Body: `{ cartId }` |
| POST | `/api/cart/remove-vip` | Remove all VIP product items from cart. Body: `{ cartId }` |

#### Subscription Customer Mapping

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/subscription-customers/map` | Upsert `SubscriptionCustomer` records mapping BC customer → Airwallex customer for each subscription product in the cart. Supports multi-product subscriptions. Body: `{ cart, bigcommerceCustomer, airwallexCustomer, orderId }` |

---

### `airwallexLivePlan.js` — Live Airwallex Plans

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/selling-plans/plans` | JWT required | List all live subscription plans |
| POST | `/api/selling-plans/plans` | JWT required | Create Airwallex product + price for a new plan |
| PUT | `/api/selling-plans/plans/:id` | JWT required | Enable/disable a plan (syncs to Airwallex) |
| POST | `/api/selling-plans/billing-customers` | None (checkout) | Create or find billing customer in Airwallex (deduplication by email) |
| POST | `/api/selling-plans/payment-customers` | None (checkout) | Create or retrieve payment customer (cus_) |
| POST | `/api/selling-plans/payment-consents` | None (checkout) | Create payment consent (for merchant-triggered recurring) |
| POST | `/api/selling-plans/payment-intents` | None (checkout) | Create payment intent |
| GET | `/api/selling-plans/payment-intents/:id` | None | Retrieve payment intent status |
| POST | `/api/selling-plans/subscriptions/provision` | None (checkout) | Provision subscription(s) after payment. Loops over all subscription products in cart, creates Airwallex subscription for each, saves `CustomerSubscription` + upserts `Subscription` projection |
| POST | `/api/selling-plans/payment-sources/create` | None (checkout) | Save payment source. Polls for verified consent, checks for existing source, then creates `psrc_` in Airwallex |

---

### `airwallexTestPlan.js` — Sandbox Airwallex Plans

Same endpoint shape as `airwallexLivePlan.js` but under `/api/subscription-plans/` prefix and targeting `api-demo.airwallex.com`. Additional endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/subscription-plans/public/enabled-product-ids` | None | Returns BigCommerce product IDs for all enabled subscription plans. Used by the frontend checkout to dynamically identify subscription items in the cart |
| POST | `/api/subscription-plans/create-checkout` | None | Create an Airwallex billing checkout session (legacy endpoint, may not be actively used) |

---

### `subscriptions.js` — Admin Subscription Management

All endpoints require JWT.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subscriptions` | List all subscriptions. Query params: `status`, `customerId`, `productId`, `externalSubscriptionId` |
| GET | `/api/subscriptions/:id` | Get single subscription with related `CustomerSubscription` and `SubscriptionCustomer` data |
| POST | `/api/subscriptions` | Create subscription placeholder (local only) |
| PATCH | `/api/subscriptions/:id` | Update subscription status locally |
| POST | `/api/subscriptions/:id/sync` | Pull latest state from Airwallex and sync to local DB (both `Subscription` projection and `CustomerSubscription`) |
| POST | `/api/subscriptions/:id/cancel` | Cancel in Airwallex + update local records. Body: `{ proration_behavior: 'ALL' | 'PRORATED' | 'NONE' }` |
| POST | `/api/subscriptions/:id/update` | Modify subscription in Airwallex — collection method, payment source, trial period, cancel at period end, duration, metadata, etc. Validates enum values, handles linked_payment_account_id logic for different collection methods |
| GET | `/api/subscriptions/:id/payment-sources` | Fetch Airwallex payment sources for a subscription's billing customer |
| POST | `/api/subscriptions/internal/upsert-from-customer-subscription` | Internal: create/update admin projection record from a `CustomerSubscription` |

---

### `dashboard.js` — Admin Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard` | JWT required | Returns subscription counts (total, active, paused, cancelled, pending), recent activity feed (with customer emails looked up from `SubscriptionCustomer`), total orders |

---

### `auth.js` — BigCommerce OAuth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth` | OAuth callback — exchanges code for access token, saves Store record |
| GET | `/api/load` | BC load callback — verifies signed JWT from BigCommerce |
| GET | `/api/uninstall` | Uninstall callback — removes Store record |

---

### `webhooks.js` — BigCommerce Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/uninstall` | SHA1 signature (verifyWebhook) | App uninstall webhook |
| POST | `/api/webhooks/order-created` | SHA1 signature (verifyWebhook) | Order created event (logging only) |

---

### `sellingPlans.js` — DB-level Selling Plans (Legacy)

> **Note:** This route file is a legacy implementation. The active plan routes are `airwallexLivePlan.js` and `airwallexTestPlan.js`. This file references a `SellingPlan` model that does not exist in the current models directory.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/selling-plans` | None | List non-deleted plans |
| POST | `/api/selling-plans` | None | Create plan in DB |
| PATCH | `/api/selling-plans/:id` | None | Update plan |
| PATCH | `/api/selling-plans/:id/status` | None | Enable/disable plan |
| POST | `/api/selling-plans/:id/sync-airwallex-product` | None | Sync product to Airwallex |
| POST | `/api/selling-plans/:id/sync-airwallex-subscription` | None | Sync subscription plan to Airwallex |

---

### `admin.js` — Store Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/summary` | JWT required | Store info + subscriber counts. Query: `?store_hash=` |
| GET | `/api/admin/subscribers` | JWT required | Recent subscribers. Query: `?store_hash=` |

---

## 6. Backend — Data Models

### `AdminUser`
```js
{
  username:     String  (unique, required),
  passwordHash: String  (bcrypt, cost 12),
  role:         String  (enum: 'admin' | 'viewer', default: 'admin'),
  createdAt, updatedAt
}
```
Create via: `node scripts/createAdmin.js <username> <password>`

---

### `Subscription` — Admin projection of a customer's subscription
```js
{
  subscriptionCustomerId:  ObjectId → SubscriptionCustomer  (required),
  customerSubscriptionId:  ObjectId → CustomerSubscription   (required),
  externalSubscriptionId:  String   (Airwallex sub ID, indexed, required),
  airwallexCustomerId:     String,
  bigcommerceCustomerId:   Number,
  customerEmail:           String   (indexed),
  planName:                String,
  productId:               Number,
  price:                   Number,
  currency:                String,
  interval:                String,
  status:                  String   (enum: pending | trialing | active | past_due | cancelled),
  nextBillingAt:           Date,
  orders:                  [{ bigcommerceOrderId, amount, currency, createdAt }],
  lastSyncedAt:            Date,
  syncStatus:              String   (enum: ok | failed),
  syncError:               String,
  createdAt, updatedAt
}
```

---

### `CustomerSubscription` — The actual recurring billing record
```js
{
  bigcommerceOrderId:       Number  (required, indexed),
  bigcommerceCustomerId:    Number  (required, indexed),
  bigcommerceProductId:     Number  (required, indexed),
  airwallexCustomerId:      String  (required, indexed),
  airwallexProductId:       String  (required),
  airwallexPriceId:         String  (required),
  airwallexSubscriptionId:  String  (unique, indexed, required),
  planName:                 String,
  status:                   String,
  amount:                   Number,
  currency:                 String,
  interval:                 String,
  trialDays:                Number,
  startedAt:                Date,
  nextBillingAt:            Date,
  cancelledAt:              Date,
  endedAt:                  Date,
  metadata:                 Object,
  createdAt, updatedAt
}
```

---

### `SubscriptionCustomer` — Maps BC customer to Airwallex customer + product
```js
{
  bigcommerceCustomerId:     Number  (required, indexed),
  bigcommerceEmail:          String  (required, indexed),
  bigcommerceFirstName:      String,
  bigcommerceLastName:       String,
  bigcommercePhone:          String,
  bigcommerceCompany:        String,
  airwallexCustomerId:       String  (required, indexed),
  airwallexName:             String,
  airwallexEmail:            String,
  airwallexType:             String,
  airwallexPhoneNumber:      String,
  cartId:                    String,
  orderId:                   Number,
  subscriptionProductId:     Number  (required),
  subscriptionProductName:   String,
  isSubscriptionCustomer:    Boolean (default: true),
  metadata:                  Object,
  unique: [bigcommerceCustomerId, subscriptionProductId],
  createdAt, updatedAt
}
```

---

### `SubscriptionPlan` — Admin-managed plan definitions
```js
{
  name:                   String  (unique, required),
  description:            String,
  currency:               String  (default: 'USD'),
  amount:                 Number  (required),
  interval:               String  (enum: 'MONTH' | 'YEAR', default: 'MONTH'),
  trialDays:              Number  (default: 14),
  airwallexProductId:     String  (required),
  airwallexPriceId:       String  (required),
  bigcommerceProductId:   Number  (unique, indexed),
  status:                 String  (enum: 'enabled' | 'disabled' | 'archived', default: 'enabled'),
  createdAt, updatedAt
}
```

---

### `BillingCustomer` — Airwallex customer record
```js
{
  airwallexCustomerId:           String  (unique, indexed, required),
  name, email, type, phone_number,
  tax_identification_number,
  default_billing_currency,
  default_legal_entity_id,
  description, nickname,
  address: { street, city, state, postcode, country_code },
  metadata:                      Map<String, String>,
  createdAt, updatedAt
}
```

---

### `Store` — BigCommerce app installation record
```js
{
  storeHash:    String  (unique, required),
  accessToken:  String,
  scope:        String,
  installedAt:  Date
}
```

---

### `Subscriber` — Simple subscriber tracking per store
```js
{
  storeHash:  String  (required),
  orderId:    Number,
  email:      String,
  status:     String  (default: 'active'),
  createdAt:  Date
}
```

---

## 7. Backend — Middleware

### `requireSession.js`
- Reads `Authorization: Bearer <token>` header
- Verifies JWT against `APP_SESSION_SECRET`
- On success: sets `req.session` = decoded JWT payload `{ id, username, role }`
- On failure: responds `401 Unauthorized`

### `verifyWebhook.js`
- Reads `req.rawBody` (captured by Express JSON verify callback in `index.js`)
- Parses `body.hash` — the signature BigCommerce sends in the payload
- Strips the `"hash":"..."` key/value from the raw body string
- Computes `SHA1(rawBodyWithoutHash)` using Node's `crypto` module
- Returns `401 Invalid signature` if hashes don't match

---

## 8. Backend — Services & Libraries

### `lib/subscriptionProducts.js`
Shared helper used by both `bigcommerceRoutes.js` and `airwallexLivePlan.js` / `airwallexTestPlan.js`:
- `getEnabledSubscriptionProductIds()` — queries `SubscriptionPlan` for enabled plans and returns their BigCommerce product IDs
- `findDistinctSubscriptionProducts(cart, subscriptionProductIds)` — scans cart line items and returns distinct subscription products (prevents duplicate provisioning per product)

### `lib/airwallex/`
Low-level wrappers around Airwallex API calls:
- `token.js` — fetches/caches Airwallex access tokens
- `client.js` — authenticated HTTP client
- `product.js` — create/list Airwallex products
- `price.js` — create/list Airwallex prices
- `subscriptionPlan.js` — create/manage subscription plans
- `subscriptionAdmin.js` — admin operations (cancel, update, sync, upsert projection). Exports:
  - `fetchAirwallexSubscription(subId)` — GET subscription from Airwallex
  - `cancelAirwallexSubscription(subId, opts)` — cancel with proration behavior
  - `updateAirwallexSubscription(subId, payload)` — update subscription attributes
  - `upsertSubscriptionProjection(customerSubscription, extras)` — creates/updates the `Subscription` (admin projection) from a `CustomerSubscription` record
  - `syncLocalSubscriptionFromAirwallex(airwallexSubscription)` — full two-way sync
  - `normaliseStatus(airwallexStatus)` — maps Airwallex status strings to local enum
  - `asDate(isoString)` — safe date parser

### `services/`
- `airwallex.js` — higher-level Airwallex operations
- `airwallexAuth.js` — auth token management
- `airwallexClient.js` — environment-aware API client (sandbox vs live)
- `airwallexSellingPlans.js` — selling plan service
- `bigcommerceOrders.js` — order creation and status helpers
- `registerWebhooks.js` — registers required BC webhooks on app install

---

## 9. Frontend — Pages

### Route Map (`App.jsx`)

```
Public routes:
  /login            → Login.jsx
  /checkout         → Checkout.jsx
  /thank-you        → ThankYou.jsx

Protected admin routes (require JWT in localStorage):
  /                 → Dashboard.jsx
  /dashboard        → Dashboard.jsx
  /subscriptions    → Subscriptions.jsx
  /selling-plans    → SellingPlans.jsx
  /subscription-plan → CreatePlan.jsx
  /settings         → AdminSettings.jsx
```

### `Login.jsx`
- Public page — no auth required
- Form: username + password
- `POST /api/admin-auth/login`
- Saves JWT via `setToken()`, navigates to `/dashboard`
- Shows error on failure

### `Dashboard.jsx`
- Protected — requires JWT
- Fetches `GET /api/dashboard`
- Shows stat cards: Total Subscribers, Active, Paused, Cancelled, Pending
- Recent activity table (searchable by customer, action, plan, subscription ID)
- Manual Refresh button
- Displays environment badge (Sandbox/Live)

### `Subscriptions.jsx`
- Protected — requires JWT
- Fetches `GET /api/subscriptions`
- Filterable list of all subscriptions
- Per-row actions:
  - **Sync** — `POST /api/subscriptions/:id/sync`
  - **Cancel** — opens modal with proration choice (`ALL` / `PRORATED` / `NONE`), then `POST /api/subscriptions/:id/cancel`
  - **Edit** — opens modal to update collection method, payment source, trial period, etc. via `POST /api/subscriptions/:id/update`
  - **Payment Sources** — fetches `GET /api/subscriptions/:id/payment-sources` to populate payment source dropdown in edit modal

### `SellingPlans.jsx`
- Protected — requires JWT
- Fetches plans from either `/api/selling-plans/plans` (live) or `/api/subscription-plans/plans` (sandbox) based on environment toggle
- Table: Name, Amount, Interval, Free Trial, Status, BC Product ID
- Status toggle button calls `PUT /api/(selling|subscription)-plans/plans/:id`
- "+ Create Plan" button opens `CreatePlanForm` modal

### `CreatePlan.jsx`
- Protected — requires JWT
- Form to create a new subscription plan
- Collects: name, description, amount, currency, interval, trial days, BC product ID
- `POST /api/(selling|subscription)-plans/plans`

### `AdminSettings.jsx`
- Protected — requires JWT
- Form to update admin username and/or password
- Requires current password for verification
- `PUT /api/admin-auth/update-credentials`

### `Checkout.jsx`
- Public — no auth required
- Entry point for customer checkout
- Parses URL params: `?cartId=` or `?cartData=` or `?error=`
- Detects `?airwallex_return=success` query param (Airwallex 3DS redirect return)
- Stores payment result in `sessionStorage`
- Provides all callback functions to `CheckoutLayout`:
  - `onCustomerCreate` — search/create BC customer
  - `onShippingAddress` — save address to BC
  - `onFetchShippingOptions` — fetch shipping quotes via consignment API
  - `onAddVipToCart` / `onRemoveVipFromCart` — VIP product management
  - `onFetchLatestCart` — refresh cart data before order
  - `onCreateAirwallexCustomer` — create billing customer
  - `onMapSubscriptionCustomer` — customer mapping to DB
  - `onProvisionSubscription` — provision Airwallex subscription
  - `clearCart` / `onCartCleared` — post-order cart cleanup
  - `onApplyCheckoutCoupon` / `onRemoveCheckoutCoupon` — coupon management
  - `onApplyCheckoutDiscount` / `onRemoveCheckoutDiscount` — discount management

### `ThankYou.jsx`
- Public
- Receives order/customer/cart state via React Router `location.state`
- Displays order confirmation
- "Continue Shopping" returns to BigCommerce store

---

## 10. Frontend — Components

### `Sidebar.jsx`
- Navigation: Dashboard, Selling Plans, Subscriptions, Settings
- Collapsible (stores state locally)
- Environment toggle (Sandbox ↔ Live) using `react-switch` — **currently commented out in the UI**
  - Saves choice to `localStorage` key `adminEnvironment`
  - Calls `setEnvironment` prop to update App.jsx state
- Logout button: calls `removeToken()` then navigates to `/login`

### `ProtectedRoute.jsx`
- Wraps admin routes in App.jsx
- Calls `isAuthenticated()` — checks if JWT exists in localStorage
- Redirects to `/login` if not authenticated

### `CheckoutLayout.jsx`
- **Orchestrates the 3-step checkout: Client → Shipping → Payment**
- Manages all checkout state: clientData, deliveryData, paymentData, airwallexCustomer, bigcommerceCustomer
- **Dynamic subscription product detection:** Loads enabled product IDs from `GET /api/subscription-plans/public/enabled-product-ids` on mount (falls back to `VITE_SUBSCRIPTION_PRODUCT_IDS` env var)
- Handles VIP product (product ID `268`) add/remove with optimistic UI updates
- Displays 10-minute promo countdown timer
- On delivery step completion: ensures Airwallex billing customer is created before moving to payment
- On payment success:
  1. Fetches latest cart data
  2. Maps subscription customers to DB (`POST /api/subscription-customers/map`)
  3. Creates BC order (`POST /api/orders/create`)
  4. Provisions subscriptions (`POST /api/selling-plans/subscriptions/provision`)
  5. Clears the cart
  6. Navigates to `/thank-you`

### `ClientStep.jsx`
- Collects: first name, last name, email, phone, company
- Look up existing BC customer by email on continue
- Creates BC customer if new

### `ShippingStep.jsx`
- Collects shipping address: address, city, country, postal code, phone
- Fetches shipping quotes via `POST /api/shipping/quotes` (BigCommerce consignment API)
- User selects shipping option from available quotes
- Saves address to BigCommerce on continue

### `PaymentStep.jsx`
- Embeds Airwallex Components SDK for card entry
- Creates payment customer → payment consent → payment intent flow
- Handles SUCCEEDED / FAILED / PENDING payment states
- On SUCCEEDED: triggers `psrc_` payment source creation, then order placement

### `OrderSummary.jsx`
- Shows line items, subscription details, applied coupons/discounts, shipping cost, order total during checkout
- Coupon code input and apply/remove functionality
- Rendered in the right column of the checkout layout

### `ThankYouStep.jsx`
- Post-order confirmation within the checkout flow (before redirect to `/thank-you`)
- Shows order details and customer greeting

---

## 11. Frontend — Auth Utilities

**File:** `src/utils/auth.js`

```js
getToken()           // returns JWT string from localStorage, or null
setToken(token)      // saves JWT to localStorage under key 'adminToken'
removeToken()        // deletes JWT from localStorage
isAuthenticated()    // returns true if token exists
authHeaders()        // returns { Authorization: 'Bearer <token>', 'ngrok-skip-browser-warning': 'true' }
handleUnauthorized() // clears token, redirects to /login
```

`authHeaders()` is used in every admin API call:
```js
const res = await fetch(API, { headers: authHeaders() });
if (res.status === 401) { handleUnauthorized(); return; }
```

---

## 12. Key Data Flows

### Admin Login
```
Browser /login
  → POST /api/admin-auth/login  (rate-limited: 10 req / 15 min)
  → bcrypt.compare(password, passwordHash)
  → jwt.sign({ id, username, role }, APP_SESSION_SECRET, { expiresIn: '8h' })
  → token saved to localStorage
  → redirect to /dashboard
```

### Customer Checkout → Subscription Created
```
Customer navigates from BigCommerce store to checkout
  → GET /api/cart?cartId=xxx redirects to frontend /checkout with cartData in URL
  → OR frontend fetches GET /api/cart-data?cartId=xxx

Checkout page loads:
  → CheckoutLayout fetches GET /api/subscription-plans/public/enabled-product-ids
     (dynamically identifies which cart items are subscriptions)

  → ClientStep:
       → GET /api/customers/search?email=xxx (find existing BC customer)
       → POST /api/customers (create BC customer if new)

  → ShippingStep:
       → POST /api/shipping/quotes { cartId, address }
          (creates consignment → returns available shipping options)
       → POST /api/customer/address (save address to BC)
       → POST /api/subscription-plans/billing-customers (ensure Airwallex customer)

  → PaymentStep:
       → POST /api/subscription-plans/payment-customers (create payment customer)
       → POST /api/subscription-plans/payment-consents (create consent)
       → POST /api/subscription-plans/payment-intents (create payment intent)
       → Airwallex SDK: collects card, processes payment
       → POST /api/subscription-plans/payment-sources/create (save psrc_)

  → Payment SUCCEEDED:
       → POST /api/subscription-customers/map
            (upsert SubscriptionCustomer for each subscription product)
       → POST /api/orders/create
            (BC order, server fetches real prices, updates status to 11 if paid)
       → POST /api/subscription-plans/subscriptions/provision
            (for each subscription product in cart:
              - look up SubscriptionPlan by bigcommerceProductId
              - create Airwallex subscription with AUTO_CHARGE + psrc_
              - save CustomerSubscription to DB
              - upsert Subscription admin projection)
       → DELETE /api/cart/:cartId (clear the cart)
       → Navigate to /thank-you
```

### Admin Manages Subscriptions
```
Admin views /subscriptions
  → GET /api/subscriptions (list all)

Admin syncs a subscription:
  → POST /api/subscriptions/:id/sync
  → Backend fetches subscription from Airwallex
  → Updates both CustomerSubscription and Subscription projection in DB

Admin cancels a subscription:
  → Modal: choose proration (ALL / PRORATED / NONE)
  → POST /api/subscriptions/:id/cancel { proration_behavior }
  → Backend calls Airwallex cancel API
  → Updates Subscription.status = 'cancelled' + CustomerSubscription in DB

Admin updates a subscription:
  → Modal: collection_method, payment_source_id, trial_ends_at, etc.
  → POST /api/subscriptions/:id/update
  → Backend calls Airwallex update API
  → Syncs response to both Subscription + CustomerSubscription
```

### BigCommerce Webhook
```
BC sends POST to /api/webhooks/order-created
  → verifyWebhook middleware:
      strip "hash" field from raw body
      SHA1(rawBodyWithoutHash) === body.hash  → 401 if mismatch
  → handler processes event (currently logging only)
```

---

## 13. Running the Project

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- BigCommerce developer account with an app created
- Airwallex account with sandbox + live credentials

### Backend
```bash
cd backend
npm install
# configure .env (use Section 4 as reference)
npm run dev          # development (nodemon, port 4000)
node index.js        # production
```

### Frontend
```bash
cd frontend
npm install
# configure .env
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview production build locally
```

### Create Initial Admin User
Run once after backend is up and MongoDB is connected:
```bash
cd backend
node scripts/createAdmin.js admin YourStrongPassword123!
```
This creates an `AdminUser` document with bcrypt-hashed password. Login at `/login`.

### Other Scripts
```bash
# Backfill subscription emails from SubscriptionCustomer to Subscription
node routes/backfill-subscription-emails.js

# Migrate subscription plan product IDs
node scripts/migrateSubscriptionPlanProductIds.js

# Seed test subscriptions
node scripts/seedSubscriptions.js
```

---

## 14. Known Issues & Remaining Work

### Code Quality

| Issue | Location | Note |
|-------|----------|------|
| `sellingPlans.js` route has no auth on CRUD | `backend/routes/sellingPlans.js` | This is a legacy route. The active plan routes are `airwallexLivePlan.js` and `airwallexTestPlan.js` |
| `syncOrders.js` uses dummy/placeholder data | `backend/routes/syncOrders.js` | Needs real BigCommerce order integration |
| `Customers.jsx` page is a placeholder | `frontend/src/pages/Customers.jsx` | Contains only a stub component — either implement or remove |
| Environment toggle commented out in Sidebar | `frontend/src/components/Sidebar.jsx` | The Sandbox ↔ Live toggle switch is commented out. Only the Live environment routes are effectively used |
| `sendOrderConfirmationEmail` is a stub | `backend/routes/bigcommerceRoutes.js` | Function logs a message but doesn't actually send emails |
| Hardcoded store hash | `backend/routes/bigcommerceRoutes.js:4` | `STORE_HASH = 'eapn6crf58'` is hardcoded. Should come from DB/env for multi-store support |
| Hardcoded VIP product ID | Multiple files | `VIP_PRODUCT_ID = 268` is hardcoded in both backend and frontend. Should be configurable |

### Infrastructure

| Issue | Note |
|-------|------|
| SPA 404 on direct URL refresh | If hosted on Apache (Namecheap), need `.htaccess` rewrite rule to serve `index.html` for all non-file paths |
| Input validation missing | No `zod` / `express-validator` on order creation, customer endpoints — add validation at API boundary |

---

## 15. Deployment Notes

### Backend Hosting
- Currently targeted at shared hosting (`app.log` file-based logging suggests non-container environment)
- `npm run start:prod` targets `index-production.js` (verify this file exists)
- Ensure `PORT` env var is set if host assigns a dynamic port
- All `console.log` and `console.error` output is also written to `app.log` via custom file writer in `index.js`

### Frontend Hosting
- Vite builds to `dist/` — deploy that folder as a static site
- Set `VITE_BACKEND_URL` to the production backend URL in `.env` before building
- A `deploy_frontend.sh` script exists in the frontend root for automated deployments
- If hosting on Apache: add `.htaccess`:
  ```apache
  Options -MultiViews
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [QSA,L]
  ```

### BigCommerce App Configuration
- OAuth redirect URI must match `BIGCOMMERCE_REDIRECT_URI` in `.env`
- Register webhooks for `store/order/created` and `store/app/uninstalled` in BC dev portal or via `registerWebhooks.js` service
- Current store: `kasweb-c4.mybigcommerce.com`

### Airwallex Configuration
- Airwallex Live keys (`AIRWALLEX_API_KEY`, `AIRWALLEX_CLIENT_ID`) for the Production environment

- `AIRWALLEX_LEGAL_ENTITY_ID` and `AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID` are required for subscription provisioning
- Frontend currently calls `/api/subscription-plans/` endpoints (sandbox prefix) for checkout flows

---

*End of handover document.*
