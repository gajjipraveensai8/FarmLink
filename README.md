# FarmFresh — Farm-to-Consumer Marketplace API

A Node.js backend for a marketplace that connects local farmers directly with buyers. Farmers list their produce, buyers place orders, and a delivery partner network handles fulfillment. Built as a learning project to demonstrate real-world backend patterns — not an academic toy app.

---

## The Problem It Solves

Most produce marketplaces are middleman-heavy. This platform gives farmers a direct channel to sell fresh, location-aware produce to nearby buyers. Buyers can search by proximity, see only in-stock and non-expired items, and track their orders in real time.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 20 (ESM) | Native ES module support, LTS support |
| Framework | Express 5 | Minimal, well-understood, widely deployed |
| Database | MongoDB + Mongoose | Flexible schema, native GeoJSON support |
| Auth | JWT via httpOnly cookie | XSS-resistant, no client-side token storage |
| Real-time | Socket.IO | Order status pushed to buyer/farmer instantly |
| Caching | In-memory LRU (custom) | Zero-dependency, works without Redis infra |
| Rate limiting | Custom sliding window | Per-route, cache-aware weighted tokens |
| Validation | express-validator | Clean declarative validation chains |
| Logging | Winston | Structured JSON logs + file transport |

---

## Architecture

```
src/
├── server.js          ← HTTP server startup only
├── app.js             ← Express config, routes, middleware wiring
├── env.js             ← dotenv loaded first (MUST be first import in server.js)
├── config/
│   └── db.js          ← MongoDB connection with retry logic
├── controllers/       ← Route handlers (thin — delegate to services)
├── services/          ← Business logic (productService, etc.)
├── models/            ← Mongoose schemas (User, Product, Order, ...)
├── middleware/
│   ├── authMiddleware.js   ← JWT verify + user fetch
│   ├── rateLimiter.js      ← Sliding window, weighted by cache hits
│   ├── errorHandler.js     ← Centralized error response
│   └── fraudGuards.js      ← Product listing validation guards
├── routes/            ← Express routers (one file per domain)
├── utils/
│   ├── cache.js        ← In-memory LRU cache with tag-based invalidation
│   ├── socket.js       ← Socket.IO init + JWT auth on connection
│   ├── AppError.js     ← Typed operational errors with HTTP status codes
│   └── asyncHandler.js ← Wraps async controllers to forward errors to next()
└── validators/        ← express-validator chains for auth + products
```

---

## Key Features

**JWT Authentication (httpOnly cookie)**
- Tokens are stored in httpOnly cookies — never in localStorage. Protects against XSS.
- Every protected route fetches the user from DB on each request to catch blocked/suspended accounts.

**Geo-search**
- Products store a GeoJSON `Point` with a `2dsphere` index. The marketplace endpoint uses MongoDB `$geoNear` to return products sorted by distance from the buyer.

**Order Placement with Stock Safety**
- Uses MongoDB transactions to atomically decrement stock and create the order. If any item is out of stock or expired, the transaction is aborted — no partial fills.

**Real-time Order Updates**
- Socket.IO emits `order_update` events to the buyer, the relevant farmer(s), and any delivery partner when an order is created, updated, or cancelled.

**In-memory LRU Cache**
- Product listing responses are cached for 60 seconds with tag-based invalidation. Adding, updating, or deleting a product immediately invalidates the `products` cache tag.
- The cache uses a true LRU eviction strategy with a 500-entry cap to prevent unbounded memory growth.

**Rate Limiting**
- Auth routes: `express-rate-limit` at 100 req / 15 min.
- Product, order, review, and dispute routes: custom sliding-window limiter at 60 req / min. Cache hits count as 0.2 tokens (cheaper), so heavy-read traffic is less likely to trigger limits.

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- A MongoDB connection string (Atlas free tier works fine)

### 1. Clone and install

```bash
git clone https://github.com/your-username/farm-backend.git
cd farm-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/farmdb?retryWrites=true&w=majority
JWT_SECRET=any_string_at_least_16_characters
```

### 3. Start the server

```bash
npm start
```

Server starts at `http://localhost:5000`. You should see:

```
MongoDB Connected
Backend running on http://localhost:5000
```

### 4. Run tests

```bash
npm test
```

Tests use `mongodb-memory-server` — no real database needed.

---

## How to Run with Docker

```bash
# Start backend + MongoDB (no Redis required — using in-memory cache)
docker compose up --build backend mongodb

# Or start everything including the frontend
docker compose up --build
```

Backend: `http://localhost:5000`  
Frontend: `http://localhost:80`

> **Note:** The `docker-compose.yml` includes a Redis service for future use. The backend does not connect to it yet — it uses an in-memory LRU cache which is sufficient for a single-instance deployment.

---

## API Overview

All responses follow the shape `{ success: boolean, message?: string, data?: any }`.

### Health

```
GET /api/health
→ 200 { success: true, message: "Healthy", data: { status: "ok" } }
```

### Auth

```
POST /api/auth/register
Body: { name, email, phone, password, role: "buyer"|"farmer"|"delivery_partner" }
→ 201  Sets httpOnly cookie `token`

POST /api/auth/login
Body: { email, password }
→ 200  Sets httpOnly cookie `token`

POST /api/auth/logout
→ 200  Clears cookie

GET  /api/auth/me         (requires cookie)
→ 200  { ...userFields }
```

### Products

```
GET  /api/products                         (public)
     ?lat=12.9716&lng=77.5946&radius=10
     &category=vegetables&minPrice=5&maxPrice=100
→ 200 { products: [...], total: N }

POST /api/products                         (farmer only)
Body: { name, price, quantity, category, harvestDate, location: { lng, lat }, freshnessExpiryDays }
→ 201 { success: true, product: {...} }

PUT  /api/products/:id                     (farmer, owner only)
DEL  /api/products/:id                     (farmer, owner only)

GET  /api/products/my                      (farmer only)
→ 200 { success: true, products: [...] }
```

### Orders

```
POST /api/orders                           (buyer only)
Body: { items: [{ productId, quantity }], deliveryType: "pickup"|"delivery", deliveryAddress? }
→ 201 { success: true, order: {...} }

GET  /api/orders/my                        (buyer only)
→ 200 { success: true, orders: [...] }

PATCH /api/orders/:id/cancel               (buyer only, if status is "placed")
Body: { reason? }
→ 200 { message: "Order cancelled successfully" }
```

### Sample: Register + Login

```bash
# Register
curl -c cookies.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@farm.com","phone":"9876543210","password":"Password123","role":"buyer"}'

# Login
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@farm.com","password":"Password123"}'

# Get products near Bangalore
curl "http://localhost:5000/api/products?lat=12.9716&lng=77.5946&radius=20"

# Health check
curl http://localhost:5000/api/health
```

---

## Project Structure Notes

- **No `.env` in the repo or Docker image.** Secrets are injected via host environment variables or CI/CD secrets.
- **No Redis dependency** for basic operation. The in-memory cache works for a single instance; swap it for Redis when you need multi-instance caching.
- **Socket.IO connections are JWT-authenticated.** Clients must send their token in `socket.handshake.auth.token`. Anonymous connections are rejected.
- **MongoDB transactions** for order creation and cancellation — stock changes are atomic and roll back on failure.
