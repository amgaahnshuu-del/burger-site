# 🍔 Final Fullstack Project - Food Delivery App

A comprehensive full-stack food delivery application built with **Next.js 16**, **Prisma ORM**, **TypeScript**, and **TailwindCSS**. This project includes customer ordering, courier delivery tracking, admin management, AI assistant, and payment processing.

**Live Demo**: Coming Soon on Render  
**Repository**: [github.com/amgaahnshuu-del/final-project](https://github.com/amgaahnshuu-del/final-project)

---

## 📋 Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Setup](#environment-setup)
6. [Database & Prisma](#database--prisma)
7. [Authentication](#authentication)
8. [Core Features](#core-features)
9. [API Endpoints](#api-endpoints)
10. [Deployment](#deployment)
11. [Scripts & Commands](#scripts--commands)
12. [Testing](#testing)

---

## ✨ Features

### 👤 User Management
- **Multi-role system**: Customer, Courier, Admin, Manager
- **Email verification** during registration with SMTP
- **Google OAuth authentication**
- **Session management** with secure cookies
- **User settings persistence** (addresses, payment preferences, notifications)

### 🍔 Food Ordering
- **Browse restaurants** and food items by category
- **Shopping cart** with quantity management
- **Order creation** with address & payment details
- **Order status tracking**: Pending → Accepted → Ready → Delivered
- **Order history** with detailed order information
- **Favorites** for quick reordering

### 💳 Payment System
- **Multiple payment methods** (QPAY, Credit Card, etc.)
- **Payment webhook integration** for provider callbacks
- **Payment lifecycle**: Pending → Succeeded/Failed → Refunded
- **Provider reference tracking** for payment reconciliation

### 🚚 Courier Delivery
- **Courier dashboard** to accept/manage orders
- **Real-time GPS tracking** via Google Maps
- **Live courier location updates** for customers
- **Order completion** with SMS delivery confirmation code
- **Courier earnings** tracking (future)

### 📍 Order Tracking
- **Google Maps integration** for live tracking
- **Static map fallback** for basic route visualization
- **Real-time courier GPS coordinates** display
- **Estimated delivery time** (future)

### 🤖 AI Assistant
- **ChatBox component** for customer support
- **Smart responses** using Gemini or OpenAI APIs with local fallback
- **Context-aware assistance** (orders, menu, tracking)
- **Accessible to all users** (public)

### 📊 Admin Dashboard
- **User management** (view, edit, delete)
- **Food & restaurant management** (create, update, inventory)
- **Order monitoring** with filtering
- **Payment tracking**
- **System health monitoring**

### 👨‍💼 Manager Dashboard
- **Restaurant order management**
- **Menu management** (food items, pricing, availability)
- **Order preparation tracking**
- **Kitchen order queue**

### ⚙️ Settings & Preferences
- **Saved addresses** (multiple, with labels)
- **Payment method preferences**
- **Notification settings**
- **Database-backed persistence** (not browser-only)

### 📱 Responsive UI
- **Mobile-first design** with TailwindCSS
- **Modern components** with Heroicons
- **Protected routes** for authenticated users
- **Role-based access control**

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | TailwindCSS 4, Heroicons |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL with Prisma ORM |
| **Authentication** | Session-based + Google OAuth |
| **Email** | Nodemailer (SMTP) |
| **Maps** | Google Maps API |
| **AI** | Gemini API + OpenAI fallback |
| **Payments** | Generic webhook (QPAY, etc.) |
| **Deployment** | Docker + Render |
| **Testing** | Node's built-in test runner |

---

## 📁 Project Structure

```
my-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── admin/               # Admin endpoints
│   │   ├── ai/                  # AI assistant endpoints
│   │   ├── auth/                # Authentication routes
│   │   ├── cart/                # Shopping cart endpoints
│   │   ├── courier/             # Courier endpoints
│   │   ├── food/                # Food management
│   │   ├── health/              # Health check
│   │   ├── manager/             # Manager endpoints
│   │   ├── order/               # Order management
│   │   ├── payments/            # Payment webhooks
│   │   ├── restaurant/          # Restaurant endpoints
│   │   └── user/                # User settings
│   ├── auth/                     # Auth pages (login, register)
│   ├── contact/                  # Contact page
│   ├── courier/                  # Courier dashboard
│   ├── favorites/                # Favorites page
│   ├── home/                     # Home page
│   ├── manager/                  # Manager dashboard
│   ├── menu/                     # Menu page
│   ├── messages/                 # Messages
│   ├── orders/                   # Orders list page
│   ├── privacy/                  # Privacy policy
│   ├── profile/                  # User profile
│   ├── protected/                # Protected routes (requires auth)
│   │   ├── cart/
│   │   ├── favorites/
│   │   ├── messages/
│   │   ├── order/
│   │   ├── orders/
│   │   ├── profile/
│   │   ├── rewards/
│   │   ├── settings/
│   │   └── tracking/
│   ├── public/                   # Public pages
│   │   ├── ai-agent/            # Public AI chat
│   │   └── explore/             # Explore page
│   ├── refund-policy/            # Refund policy
│   ├── settings/                 # Settings page
│   ├── terms/                    # Terms page
│   ├── track-order/              # Order tracking
│   ├── admin/                    # Admin dashboard
│   ├── ai-assistant/             # AI assistant page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   └── manifest.ts               # PWA manifest
├── components/                   # Reusable React components
│   ├── ai/                       # AI components
│   ├── courier/                  # Courier UI components
│   ├── home/                     # Home page components
│   ├── layout/                   # Layout components
│   ├── legal/                    # Legal page components
│   ├── manager/                  # Manager UI components
│   ├── messages/                 # Message components
│   ├── order/                    # Order components
│   ├── tracking/                 # Tracking components
│   └── ui/                       # Generic UI components
├── features/                     # Business logic & services
│   ├── admin/                    # Admin services
│   ├── ai/                       # AI services
│   ├── auth/                     # Auth services
│   ├── cart/                     # Cart logic
│   ├── courier/                  # Courier services
│   ├── favorites/                # Favorites logic
│   ├── feedback/                 # Feedback services
│   ├── food/                     # Food services
│   ├── manager/                  # Manager services
│   ├── order/                    # Order services
│   └── settings/                 # Settings services
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   └── useInterfaceSettings.ts    # Settings hook
├── lib/                          # Utility functions
│   ├── admin-navigation.ts        # Admin menu config
│   ├── auth.ts                   # Auth utilities
│   ├── constants.ts              # App constants
│   ├── dashboard.ts              # Dashboard helpers
│   ├── default-*.ts              # Default data for roles
│   ├── demo-accounts.ts          # Demo account setup
│   ├── email.ts                  # Email utilities
│   ├── fetcher.ts                # API fetcher
│   ├── food-images.ts            # Food image URLs
│   ├── google-auth.ts            # Google OAuth config
│   ├── helpers.ts                # General helpers
│   ├── order-lifecycle.ts        # Order state machine
│   ├── password.ts               # Password utilities
│   ├── pending-registration.ts    # Registration flow
│   ├── prisma.ts                 # Prisma client singleton
│   ├── rate-limit.ts             # Rate limiting
│   ├── server-error.ts           # Server error handling
│   ├── settings-preferences.ts    # Settings logic
│   └── site.ts                   # Site metadata
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Data models
│   ├── seed-menu.sql             # Menu seed data
│   └── migrations/               # Database migrations
├── types/                        # TypeScript type definitions
├── hooks/                        # Custom React hooks
├── scripts/                      # Utility scripts
│   ├── ensure-menu-foods.mts     # Ensure menu exists
│   ├── seed-demo-orders.mts      # Seed demo orders
│   └── seed-orders.cjs           # Legacy seed
├── tests/                        # Automated tests
│   ├── order-lifecycle.test.mts  # Order state tests
│   └── settings-preferences.test.mts # Settings tests
├── generated/                    # Generated files (Prisma client)
├── public/                       # Static assets
│   ├── hero-ref/                 # Hero images
│   ├── home-crops/               # Home page crops
│   └── maps/                     # Map assets
├── docker/                       # Docker configuration
├── Dockerfile                    # Docker image definition
├── docker-compose.yml            # Docker Compose config (root)
├── render.yaml                   # Render deployment config
├── next.config.ts                # Next.js config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ 
- **npm** or **yarn**
- **PostgreSQL** database
- **Git**

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/amgaahnshuu-del/final-project.git
   cd final-project/my-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate deploy
   npm run db:ensure-menu          # Ensure food menu exists
   npm run db:seed:demo            # Optional: load demo data
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database & Prisma

### Database Models

The application uses **Prisma ORM** with **PostgreSQL** and includes these core models:

- **User**: Customers, Couriers, Admins, Managers
- **Restaurant**: Food merchants
- **Food**: Menu items with pricing and availability
- **Cart & CartItem**: Shopping cart management
- **Order & OrderItem**: Order details with items
- **Payment**: Payment records with provider reference
- **Tracking**: Real-time GPS coordinates
- **UserSettings & SavedAddress**: User preferences and addresses
- **Session**: Authentication sessions
- **Feedback**: Customer reviews (optional)

### Database Setup

```bash
# Initialize database migrations
npx prisma migrate deploy

# Generate Prisma client
npm run prisma:generate

# Seed menu data
npm run db:ensure-menu

# Optional: Load demo orders
npm run db:seed:demo
```

If you are switching from an older MySQL setup, provision a PostgreSQL database first and then point `DATABASE_URL` at the new PostgreSQL instance before running migrations. Existing MySQL rows are not copied automatically by this repo.

### Viewing Database (DevTools)

```bash
npx prisma studio
```

Opens Prisma Studio at [http://localhost:5555](http://localhost:5555) for browsing and editing data.

---

## 🔐 Authentication

### Session-Based Auth
- Uses HTTP-only secure cookies
- Server-side session validation
- Protected API routes with middleware

### Google OAuth Integration
- **Setup**: Configure credentials in [Google Cloud Console](https://console.cloud.google.com)
- **Callback URL**: `http://localhost:3000/api/auth/google/callback`
- **Environment Variables**:
  ```
  GOOGLE_CLIENT_ID=your-client-id
  GOOGLE_CLIENT_SECRET=your-secret
  GOOGLE_REDIRECT_URI=your-callback-url (optional)
  ```

### Email Verification
- 6-digit code sent via SMTP
- User must verify email before account activation
- Uses Nodemailer for email delivery

### Protected Routes

Routes under `/protected/*` require authentication and check user role:

```typescript
// Example: /protected/orders (customers only)
// Example: /admin (admin only)
// Example: /courier (courier only)
// Example: /manager (manager only)
```

---

## 🎯 Core Features

### 1. Food Ordering Flow
```
Browse Menu → Add to Cart → Checkout → Select Address & Payment 
→ Place Order → Wait for Acceptance → Ready for Courier 
→ Courier Pickup → Delivery → Complete
```

### 2. Order Lifecycle States
- **PENDING**: Waiting for restaurant acceptance
- **ACCEPTED**: Order confirmed by restaurant
- **READY_FOR_COURIER**: Ready for pickup
- **DELIVERED**: Order completed
- **CANCELLED**: Order cancelled

### 3. Payment Lifecycle
- **PENDING**: Awaiting payment confirmation
- **SUCCEEDED**: Payment successful
- **FAILED**: Payment declined
- **REFUNDED**: Money returned to customer

### 4. Courier System
- Couriers accept available orders
- GPS tracking shows customer live location
- Delivery confirmation updates order status
- Earnings tracked per delivery

### 5. User Settings
```typescript
// Persisted to database
- Multiple saved addresses with labels
- Preferred payment method
- Notification preferences
- Geographic location (Khoroo, District)
```

### 6. Role-Based Access
| Role | Features | Dashboard |
|------|----------|-----------|
| **Customer** | Order, track, favorites, settings | /orders, /tracking |
| **Courier** | Accept orders, deliver, GPS | /courier |
| **Manager** | Menu, kitchen queue, analytics | /manager |
| **Admin** | All + user management, system | /admin |

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # Login with email/password
POST   /api/auth/google/callback    # Google OAuth callback
GET    /api/auth/me                 # Get current user
```

### Food & Menu
```
GET    /api/food                    # List all foods
GET    /api/restaurant              # List restaurants
```

### Shopping Cart
```
GET    /api/cart                    # Get user's cart
POST   /api/cart                    # Add item to cart
DELETE /api/cart/:itemId            # Remove item from cart
```

### Orders
```
GET    /api/order                   # List user's orders
GET    /api/order/:id               # Get order details
POST   /api/order                   # Create new order
PATCH  /api/order/:id               # Update order status
```

### Courier
```
GET    /api/courier/orders          # Available orders for courier
PATCH  /api/courier/orders/:id      # Accept/deliver order
```

### Payments
```
POST   /api/payments/webhook        # Payment provider webhook
```

### User Settings
```
GET    /api/user/settings           # Get user settings
PATCH  /api/user/settings           # Update settings & addresses
```

### Admin
```
GET    /api/admin/users             # List all users
POST   /api/admin/users             # Create user
PATCH  /api/admin/users/:id         # Edit user
DELETE /api/admin/users/:id         # Delete user
```

### Manager
```
GET    /api/manager/orders          # Restaurant orders
PATCH  /api/manager/orders/:id      # Update order preparation
```

### AI Assistant
```
POST   /api/ai                      # Send message to the AI assistant
```

### System Health
```
GET    /api/health                  # Health check endpoint
```

---

## 🌐 Environment Variables

### Critical (Required)
```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### Authentication
```bash
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback  # Optional
```

### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
SMTP_FROM_NAME=Burger App
```

### SMS (Twilio)
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
```

Courier delivery confirmation codes are sent to the customer's real phone number through Twilio SMS.

### AI
```bash
AI_PROVIDER=auto                   # auto | gemini | openai | local
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=your-openai-api-key # optional fallback
OPENAI_MODEL=gpt-5.2-chat-latest
```

### Google Maps
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### Payments
```bash
PAYMENT_WEBHOOK_SECRET=your-random-secret-key-here
```

### App Settings
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
ENABLE_DEMO_ACCOUNTS=true  # Dev only
NODE_VERSION=22
```

---

## 📊 Database Entities

### User Roles
```typescript
enum UserRole {
  CUSTOMER   // Regular food ordering
  COURIER    // Delivery personnel
  MANAGER    // Restaurant staff
  ADMIN      // System administrator
}
```

### Order Status
```typescript
enum OrderStatus {
  PENDING              // Awaiting acceptance
  ACCEPTED             // Confirmed by restaurant
  READY_FOR_COURIER    // Ready for pickup
  DELIVERED            // Completed
  CANCELLED            // Cancelled
}
```

### Payment Method
```typescript
enum PaymentMethod {
  QPAY                 // Mongolia payment
  CREDIT_CARD          // Generic card
  BANK_TRANSFER        // Bank transfer
}
```

---

## 🚀 Deployment

### Deploy to Render

1. **Connect Repository**
   - Go to [render.com](https://render.com)
   - Create new **Web Service**
   - Connect GitHub repo: `amgaahnshuu-del/final-project`
   - Select branch: `main`

2. **Configuration**
   - Render auto-detects `render.yaml`
   - No need to manually configure

3. **Environment Variables**
   Add in Render dashboard:
   ```
   DATABASE_URL              (from your PostgreSQL provider)
   AI_PROVIDER               (auto or gemini)
   GEMINI_API_KEY
   GEMINI_MODEL              (optional, default: gemini-2.5-flash)
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   SMTP_* (all email variables)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   PAYMENT_WEBHOOK_SECRET
   NEXT_PUBLIC_APP_URL       (your deployed domain)
   NODE_VERSION              (22)
   ```

4. **Deploy**
   - Click **Deploy**
   - Wait for build & startup
   - Test health endpoint: `https://yourdomain.com/api/health`

### Render YAML Config
```yaml
services:
  - type: web
    name: burger-app
    runtime: node
    plan: free  # or pro
    autoDeployTrigger: commit
    healthCheckPath: /api/health
    buildCommand: npm ci && npm run build:render
    preDeployCommand: npm run migrate:deploy
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: "20"
      # Add your environment variables
```

### Docker Deployment

Build and run locally:
```bash
docker build -t burger-app .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e GOOGLE_CLIENT_ID="..." \
  burger-app
```

Or with Docker Compose:
```bash
docker-compose up -d
```

---

## 📦 Scripts & Commands

### Development
```bash
npm run dev              # Start dev server on http://localhost:3000
npm run build           # Build for production
npm start               # Run production build
```

### Database
```bash
npm run prisma:generate # Generate Prisma client
npm run migrate:deploy  # Apply pending migrations
npm run db:ensure-menu  # Ensure food menu exists
npm run db:seed:demo    # Load demo orders & users
npm run db:seed:menu    # Seed menu from SQL file
```

### Code Quality
```bash
npm run lint            # Run ESLint
npm run test            # Run tests
npm run build           # Build & check for errors
```

### Build for Render
```bash
npm run build:render    # Optimize for Render deployment
```

---

## 🧪 Testing

The project uses **Node's built-in test runner** for critical business logic:

```bash
npm run test
```

### Test Files
- `tests/order-lifecycle.test.mts` - Order state machine tests
- `tests/settings-preferences.test.mts` - User settings validation

---

## 📝 Demo Accounts

Demo accounts are created automatically in development:

| Role | Email | Password |
|------|-------|----------|
| **Customer** | customer@demo.com | demo123 |
| **Courier** | courier@demo.com | demo123 |
| **Manager** | manager@demo.com | demo123 |
| **Admin** | admin@demo.com | demo123 |

To disable in production:
```bash
ENABLE_DEMO_ACCOUNTS=false
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
npx lsof -i :3000  # Find process
kill -9 <PID>      # Kill process
```

### Database Connection Error
```bash
# Verify DATABASE_URL is set correctly
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin < /dev/null
```

### Missing Email Configuration
Set `SMTP_*` variables or registration won't send verification codes.

### Google Maps Not Showing
Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and enable Maps Embed API in Google Cloud Console.

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

## 📄 License

This project is private. All rights reserved.

---

## 👤 Author

**Amgaahnshuu** - Full Stack Developer  
Repository: [github.com/amgaahnshuu-del/final-project](https://github.com/amgaahnshuu-del/final-project)

---

**Last Updated**: May 12, 2026
```

## Docker

This repo can now run with Docker Compose from the workspace root.

If `my-app/.env` does not exist yet, create it first:

```bash
cp my-app/.env.example my-app/.env
```

Start the app and PostgreSQL together:

```bash
docker compose up --build
```

Services:

- App: [http://localhost:3001](http://localhost:3001)
- PostgreSQL: `localhost:5433`

Inside Docker, the app automatically overrides `DATABASE_URL` to:

```bash
postgresql://burger:burger@db:5432/food_db?schema=public
```

That means your existing local `.env` can still keep `localhost:5433` for non-Docker development.

Optional first-run seed:

```bash
docker compose exec app npm run db:seed:menu
```

Useful commands:

```bash
docker compose down
docker compose down -v
```

If you change `NEXT_PUBLIC_...` variables such as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, rebuild so Next.js can bake the new public value into the client bundle:

```bash
docker compose up --build
```

## Deploy on Render

This repo is now prepared for Render with a [`render.yaml`](./render.yaml) Blueprint and a health check endpoint at `/api/health`.

### 1. Push the repo to GitHub

Render deploys from a Git repository, so push this project to GitHub first.

### 2. Create the web service from `render.yaml`

In Render:

1. Click `New +`
2. Choose `Blueprint`
3. Select this repository
4. Confirm the detected `render.yaml`

The web service uses:

- Build command: `npm ci && npm run build:render`
- Pre-deploy command: `npm run migrate:deploy`
- Start command: `npm start`
- Health check path: `/api/health`

### 3. Set required environment variables

During the initial Blueprint setup, Render will prompt you for these secret values:

```bash
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
SMTP_FROM
```

`SMTP_FROM_NAME` is already set to `Burger` in the Blueprint.

### 4. Use a PostgreSQL database

This app uses Prisma with PostgreSQL, so `DATABASE_URL` must point to a PostgreSQL database.

You can use either:

- a Render PostgreSQL private service
- an external PostgreSQL provider

If you use Render PostgreSQL, create it separately first, then paste its internal connection string into `DATABASE_URL`.

Example format:

```bash
postgresql://USER:PASSWORD@postgres:5432/DATABASE_NAME?schema=public
```

### 5. Update Google OAuth callback URLs

After Render gives you a live domain, add it in Google Cloud Console as an authorized redirect URI:

```text
https://your-service-name.onrender.com/api/auth/google/callback
```

If you later connect a custom domain, add that callback too.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
