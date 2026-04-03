# Handover Document — Nomade Horizon (Ascend)

**Project:** Ascend — Subscriptions at Convenience
**Author:** KasWebtech
**Date:** 2026-03-29
**Status:** In development — authentication complete, checkout functional, admin panel functional

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
13. [Security Implementation](#13-security-implementation)
14. [Running the Project](#14-running-the-project)
15. [Known Issues & Remaining Work](#15-known-issues--remaining-work)
16. [Deployment Notes](#16-deployment-notes)

---

## 1. Project Overview

Ascend is a **subscription management system** built as a BigCommerce app. It allows:

- **Customers** to subscribe to products at checkout (payment processed via Airwallex)
- **Admins** to manage subscriptions, selling plans, and customer data through a protected dashboard

The system bridges three external platforms:
- **BigCommerce** — e-commerce store, customer records, orders
- **Airwallex** — payment processing, recurring billing, subscription engine
- **MongoDB Atlas** — persistent data store for subscriptions, customers, plans

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js + Express 5 |
| Database | MongoDB via Mongoose |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Rate limiting | `express-rate-limit` |
| Frontend | React 19 + React Router 7 + Vite |
| Styling | Tailwind CSS |
| Payment UI | `@airwallex/components-sdk` |
| Payment API | `@airwallex/node-sdk` |
| E-commerce | BigCommerce Management API + OAuth |
| Date handling | `dayjs` |
| Icons | `lucide-react` |

---

## 3. Repository Structure

```
Nomade-Horizon-Wassil/
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
│   │   ├── adminAuth.js                   (login + /me)
│   │   ├── admin.js                       (store summary, subscribers)
│   │   ├── airwallexLivePlan.js           (LIVE plan CRUD + checkout endpoints)
│   │   ├── airwallexTestPlan.js           (SANDBOX plan CRUD + checkout endpoints)
│   │   ├── auth.js                        (BigCommerce OAuth install/load/uninstall)
│   │   ├── bigcommerceRoutes.js           (BC customers, products, orders)
│   │   ├── dashboard.js                   (admin dashboard stats)
│   │   ├── sellingPlans.js                (selling plan DB CRUD)
│   │   ├── subscriptions.js               (admin subscription management)
│   │   ├── syncOrders.js                  (order sync utility)
│   │   └── webhooks.js                    (BC webhook receivers)
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
│   │   └── airwallex/
│   │       ├── client.js
│   │       ├── price.js
│   │       ├── product.js
│   │       ├── subscriptionAdmin.js
│   │       ├── subscriptionPlan.js
│   │       └── token.js
│   │
│   └── scripts/
│       ├── createAdmin.js                 (one-time: seed initial admin user)
│       ├── seedSubscriptions.js
│       └── migrateSubscriptionPlanProductIds.js
│
└── frontend/
    ├── package.json
    ├── .env
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    │
    └── src/
        ├── App.jsx                        (router, layout, environment state)
        ├── index.jsx
        ├── index.css
        │
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Subscriptions.jsx
        │   ├── SellingPlans.jsx
        │   ├── CreatePlan.jsx
        │   ├── Checkout.jsx
        │   ├── ThankYou.jsx
        │   └── Customers.jsx              (currently unused / commented out)
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
        └── styles/
            └── checkout.css
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
FRONTEND_CHECKOUT_URL=             # checkout page URL

# Airwallex — Sandbox
AIRWALLEX_API_KEY=
AIRWALLEX_CLIENT_ID=
AIRWALLEX_ENV=sandbox
AIRWALLEX_BASE_URL=https://api.airwallex.com
AIRWALLEX_LEGAL_ENTITY_ID=
AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID=

# Airwallex — Live
AIRWALLEX_LIVE_API_KEY=
AIRWALLEX_LIVE_CLIENT_ID=
AIRWALLEX_LIVE_BASE_URL=https://api.airwallex.com

# MongoDB
MONGO_URI=mongodb+srv://...

# BigCommerce direct API
BC_API_TOKEN=
```

### Frontend (`frontend/.env`)

```env
VITE_BACKEND_URL=https://apicheckout.nomade-horizon.com
VITE_SUBSCRIPTION_PRODUCT_IDS=<comma-separated BigCommerce product IDs that are subscriptions>
```

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

**Login response:**
```json
{ "token": "<jwt>", "username": "admin", "role": "admin" }
```

---

### `subscriptions.js` — Admin Subscription Management

All endpoints require JWT.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subscriptions` | List all subscriptions. Query params: `status`, `customerId`, `productId`, `externalSubscriptionId` |
| GET | `/api/subscriptions/:id` | Get single subscription with related customer data |
| POST | `/api/subscriptions` | Create subscription placeholder |
| PATCH | `/api/subscriptions/:id` | Update subscription status locally |
| POST | `/api/subscriptions/:id/sync` | Pull latest state from Airwallex and update DB |
| POST | `/api/subscriptions/:id/cancel` | Cancel in Airwallex + update local record. Body: `{ proration_behavior: 'ALL' \| 'PRORATED' \| 'NONE' }` |
| POST | `/api/subscriptions/:id/update` | Modify subscription in Airwallex (collection method, payment source, trial period, etc.) |
| GET | `/api/subscriptions/:id/payment-sources` | Fetch Airwallex payment sources available for a customer |
| POST | `/api/subscriptions/internal/upsert-from-customer-subscription` | Internal: create admin projection record from a CustomerSubscription |

---

### `dashboard.js` — Admin Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard` | JWT required | Returns subscription counts (total, active, paused, cancelled, pending), recent activity feed, total orders |

---

### `airwallexLivePlan.js` — Live Airwallex Plans

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/selling-plans/plans` | JWT required | List all live subscription plans |
| POST | `/api/selling-plans/plans` | JWT required | Create Airwallex product + price for a new plan |
| PUT | `/api/selling-plans/plans/:id` | JWT required | Enable/disable a plan |
| POST | `/api/selling-plans/billing-customers` | None (checkout) | Create billing customer in Airwallex |
| POST | `/api/selling-plans/payment-customers` | None (checkout) | Create payment customer |
| POST | `/api/selling-plans/payment-consents` | None (checkout) | Create payment consent |
| POST | `/api/selling-plans/payment-intents` | None (checkout) | Create payment intent |
| POST | `/api/selling-plans/subscriptions/provision` | None (checkout) | Provision subscription after payment |
| POST | `/api/selling-plans/payment-sources/create` | None (checkout) | Save payment source |

### `airwallexTestPlan.js` — Sandbox Airwallex Plans

Identical endpoint shape as `airwallexLivePlan.js` but under `/api/subscription-plans/` and targeting `api-demo.airwallex.com`.

---

### `bigcommerceRoutes.js` — BigCommerce Integration

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products/subscription` | None | Fetch subscription products from BC catalog |
| GET | `/api/customers/:email` | None | Look up BC customer by email |
| POST | `/api/customers/create` | None | Create new BC customer |
| POST | `/api/orders/create` | None (checkout) | Create order in BigCommerce. **Prices are fetched server-side from BC catalog — client-supplied prices are ignored** |
| GET | `/api/shipping-methods` | None | Fetch available shipping methods |
| GET | `/api/products/:id/inventory` | None | Get product inventory |
| PUT | `/api/orders/:orderId/status` | None | Update order status |
| POST | `/api/customers/:customerId/add-vip` | None | Add VIP product to cart |
| POST | `/api/customers/:customerId/remove-vip` | None | Remove VIP product |
| GET | `/api/customers` | None | List customers |

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
| POST | `/api/webhooks/order-created` | SHA1 signature (verifyWebhook) | Order created event (logging) |

---

### `sellingPlans.js` — DB-level Selling Plans

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/selling-plans` | None | List non-deleted plans |
| POST | `/api/selling-plans` | None | Create plan in DB |
| PATCH | `/api/selling-plans/:id` | None | Update plan |

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
  subscriptionCustomerId:  ObjectId → SubscriptionCustomer,
  customerSubscriptionId:  ObjectId → CustomerSubscription,
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
  metadata:                Object,
  cancelAtPeriodEnd:       Boolean,
  collectionMethod:        String,
  paymentSourceId:         String,
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
- Strips the `"hash":"..."` key/value from the raw body string (both comma-before and comma-after patterns)
- Computes `SHA1(rawBodyWithoutHash)` using Node's `crypto` module
- Returns `401 Invalid signature` if hashes don't match

---

## 8. Backend — Services & Libraries

### `lib/airwallex/`
Low-level wrappers around Airwallex API calls:
- `token.js` — fetches/caches Airwallex access tokens
- `client.js` — authenticated HTTP client
- `product.js` — create/list Airwallex products
- `price.js` — create/list Airwallex prices
- `subscriptionPlan.js` — create/manage subscription plans
- `subscriptionAdmin.js` — admin operations (cancel, update, sync)

### `services/`
- `airwallex.js` — higher-level Airwallex operations
- `airwallexAuth.js` — auth token management
- `airwallexClient.js` — environment-aware API client (sandbox vs live)
- `airwallexSellingPlans.js` — selling plan service
- `bigcommerceOrders.js` — order creation and status helpers
- `registerWebhooks.js` — registers required BC webhooks on app install

---

## 9. Frontend — Pages

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

### `Checkout.jsx`
- Public — no auth required
- Entry point for customer checkout
- Detects `?airwallex_return=true` query param (Airwallex 3DS redirect return)
- Stores payment result in `sessionStorage`
- Renders `CheckoutLayout`

### `ThankYou.jsx`
- Public
- Receives order/customer/cart state via React Router `location.state`
- Displays order confirmation
- "Continue Shopping" returns to BigCommerce store

---

## 10. Frontend — Components

### `Sidebar.jsx`
- Navigation: Dashboard, Selling Plans, Subscriptions
- Collapsible (stores state locally)
- Environment toggle (Sandbox ↔ Live) using `react-switch`
  - Saves choice to `localStorage` key `adminEnvironment`
  - Calls `setEnvironment` prop to update App.jsx state
- Logout button: calls `removeToken()` then navigates to `/login`

### `ProtectedRoute.jsx`
- Wraps admin routes in App.jsx
- Calls `isAuthenticated()` — checks if JWT exists in localStorage
- Redirects to `/login` if not authenticated

### `CheckoutLayout.jsx`
- Orchestrates the 3-step checkout: **Client → Shipping → Payment**
- Manages all checkout state: clientData, deliveryData, paymentData, airwallexCustomer
- Detects subscription products in cart via `VITE_SUBSCRIPTION_PRODUCT_IDS`
- Handles VIP product (hardcoded product ID `268`) add/remove
- On payment success: places order via `POST /api/orders/create`, then `POST /api/selling-plans/subscriptions/provision`

### `ClientStep.jsx`
- Collects: first name, last name, email
- Looks up existing BC customer by email
- Creates BC customer if new
- Creates Airwallex billing customer

### `ShippingStep.jsx`
- Collects shipping address
- Fetches shipping methods from BigCommerce
- User selects shipping option

### `PaymentStep.jsx`
- Embeds Airwallex Components SDK for card entry
- Creates payment intent via `POST /api/selling-plans/payment-intents`
- Handles SUCCEEDED / FAILED / PENDING payment states
- Triggers order placement on SUCCEEDED

### `OrderSummary.jsx`
- Shows line items, subscription details, order total during checkout

### `ThankYouStep.jsx`
- Post-order confirmation within the checkout flow (before redirect)

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
Checkout page loads
  → ClientStep: GET /api/customers/:email (find or create BC customer)
  → ClientStep: POST /api/selling-plans/billing-customers (create Airwallex customer)
  → ShippingStep: GET /api/shipping-methods
  → PaymentStep: POST /api/selling-plans/payment-intents
  → Airwallex SDK: collects card, processes payment
  → payment SUCCEEDED:
      → POST /api/orders/create          (BC order, server fetches real prices)
      → POST /api/selling-plans/subscriptions/provision  (Airwallex subscription)
      → Subscription + SubscriptionCustomer + CustomerSubscription saved to DB
  → redirect to /thank-you
```

### Admin Cancels Subscription
```
Admin clicks Cancel on /subscriptions
  → modal: choose proration (ALL / PRORATED / NONE)
  → POST /api/subscriptions/:id/cancel  { proration_behavior }
  → backend calls Airwallex cancel API
  → Subscription.status updated to 'cancelled' in DB
  → UI updates row status
```

### BigCommerce Webhook
```
BC sends POST to /api/webhooks/order-created
  → verifyWebhook middleware:
      strip "hash" field from raw body
      SHA1(rawBodyWithoutHash) === body.hash  → 401 if mismatch
  → handler processes event
```

---

## 13. Security Implementation

### Authentication & Authorisation
- All admin-facing endpoints (`/api/subscriptions`, `/api/dashboard`, `/api/admin`, `/api/sync-orders`) protected by `requireSession` middleware at router mount level
- Plan CRUD (`GET/POST/PUT /plans`) on both live and sandbox plan routers protected per-route
- Checkout endpoints (billing-customers, payment-intents, provision) left public — required for unauthenticated customer checkout flow

### Password Security
- bcrypt with cost factor 12 for all admin passwords
- Generic error message on failed login ("Invalid credentials") — no username enumeration

### Rate Limiting
- Login endpoint: 10 requests per IP per 15 minutes via `express-rate-limit`
- On breach: `429 Too Many Requests` with JSON error message

### Webhook Integrity
- `verifyWebhook.js` computes `SHA1(rawBody without hash field)` and compares to the `hash` value BigCommerce sends — rejects forged webhooks with 401

### Price Integrity
- `POST /api/orders/create` ignores all client-submitted price fields
- Server fetches authoritative prices from `GET https://api.bigcommerce.com/stores/:hash/v3/catalog/products/:id`
- Prevents price tampering attacks from the checkout page

### Transport Security
- CORS whitelist: specific domains + ngrok regex for development
- `Access-Control-Allow-Private-Network: true` header set globally
- Credentials: true on CORS (required for cookie-based flows if added later)

### Token Storage
- JWT currently stored in `localStorage` — acceptable for current scope

---

## 14. Running the Project

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- BigCommerce developer account with an app created
- Airwallex account with sandbox + live credentials

### Backend
```bash
cd backend
npm install
# configure .env (copy from .env.example if exists, or use Section 4 as reference)
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

---

## 15. Known Issues & Remaining Work

### Code Quality

| Issue | Location | Note |
|-------|----------|------|
| Multiple "copy" route/component files | `backend/routes/`, `frontend/src/components/Checkout/` | Delete `*copy*.js` / `*copy*.jsx` backup files |
| `sellingPlans.js` route has no auth on CRUD | `backend/routes/sellingPlans.js` | Review if this route is still used; `airwallexLivePlan.js` and `airwallexTestPlan.js` are the active plan routes |
| `syncOrders.js` uses dummy/placeholder data | `backend/routes/syncOrders.js` | Needs real BigCommerce order integration |
| `Customers.jsx` page is commented out in nav | `frontend/src/components/Sidebar.jsx:18` | Either implement or remove the file |

### Infrastructure

| Issue | Note |
|-------|------|
| SPA 404 on direct URL refresh | If hosted on Apache (Namecheap), need `.htaccess` rewrite rule to serve `index.html` for all non-file paths |
| Input validation missing | No `zod` / `express-validator` on order creation, customer endpoints — add validation at API boundary |
| Error response sanitization | Stack traces may leak in production — wrap errors in production-safe messages |

---

## 16. Deployment Notes

### Backend Hosting
- Currently targeted at shared hosting (`app.log` file-based logging suggests non-container environment)
- `npm run start:prod` targets `index-production.js` (check if this file exists and is up to date)
- Ensure `PORT` env var is set if host assigns a dynamic port

### Frontend Hosting
- Vite builds to `dist/` — deploy that folder as a static site
- Set `VITE_BACKEND_URL` to the production backend URL in `.env` before building
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

### Airwallex Configuration
- Sandbox keys (`AIRWALLEX_API_KEY`, `AIRWALLEX_CLIENT_ID`) for the toggle "Sandbox" environment
- Live keys (`AIRWALLEX_LIVE_API_KEY`, `AIRWALLEX_LIVE_CLIENT_ID`) for the toggle "Live" environment
- Frontend environment toggle switches which backend route prefix is called (`/api/subscription-plans` vs `/api/selling-plans`)

---

*End of handover document.*
