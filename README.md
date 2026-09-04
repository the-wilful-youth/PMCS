# PMCS - Project Manager Portal

## Overview

PMCS (Project Manager Control System) is a comprehensive enterprise-ready web-based project management portal designed for academic and software project teams. Built with Next.js 16, TypeScript, and React, it provides a secure, high-performance interface for managing tasks, teams, documents, research papers, datasets, meetings, milestones, issues, calendars, reports, and activity logs.

This implementation features a robust architecture engineered for **high concurrency, Redis-backed distributed caching, CPU-level multi-worker clustering, and enterprise load balancing**.

---

## Key Features

- **Authentication & Authorization**: Cryptographic SHA-256 salted password hashing, role-based access control (Admin/Member), and secure server-side proxy route guards.
- **Dashboard**: Real-time project health indicators (`ON TRACK`, `AT RISK`, `CRITICAL`), task statistics, and workload metrics.
- **Task Management**: Kanban and list views, status updates, priority tags, assignments, and dependencies.
- **Team Collaboration**: Member profiles, role assignment, workload assessment, and contribution tracking.
- **Document Management**: Categorized document index, version control history, status tracking, and external file linking.
- **Research Tracking**: Academic paper repository with citation metadata, DOI/URL tracking, relevance scores, and responsible member assignments.
- **Dataset Management**: Dual status tracking (access status and analysis status), platform/OS compatibility, and sample metrics.
- **Meetings & Action Items**: Meeting records, agendas, decisions, and one-click action-item-to-task conversion.
- **Milestone Tracking**: Visual progress bars calculated dynamically from associated tasks, target dates, and success criteria.
- **Issue Tracking**: Severity levels (Critical, High, Medium, Low), problem descriptions, resolution logs, and assignee tracking.
- **Integrated Calendar**: Multi-view schedule (Month, Week, Day) aggregating task deadlines, team meetings, and major milestones.
- **Reporting System**: On-demand report generation (Project Progress, Member Contribution, Research, Dataset, Issue) with export formats.
- **Activity Log**: Immutable audit trail of all project events and state changes.

---

## High-Concurrency & Scalability Architecture

### 1. Multi-Worker Clustered Server (`server.js`)
- Utilizes Node.js native `cluster` module to scale across **all available CPU cores**.
- Master supervisor process distributes incoming HTTP connections across workers via kernel IPC.
- **Self-Healing**: Automatically monitors worker health and immediately spawns a replacement worker if any process exits, ensuring zero downtime.
- Run with:
  ```bash
  npm run cluster        # Development multi-worker cluster
  npm run start:cluster  # Production multi-worker cluster
  ```

### 2. Distributed Caching with Redis (`lib/cache.ts` & `lib/redis.ts`)
- Enterprise `CacheManager` powered by `ioredis`.
- **Automatic Graceful Fallback**: If Redis is not running or network connectivity drops, the system automatically falls back to an ultra-fast in-memory TTL cache with LRU eviction without throwing unhandled exceptions.
- `cache.getOrSet()` pattern prevents cache stampedes and database exhaustion under heavy traffic spikes.
- Configurable via `REDIS_URL` or `REDIS_HOST` / `REDIS_PORT`.

### 3. Production Load Balancing (`load-balancer/`)
- **Nginx Reverse Proxy (`load-balancer/nginx.conf`)**:
  - `least_conn` load balancing across PMCS upstream instances.
  - HTTP keepalive connection pooling (`keepalive 64`).
  - Microcaching (`proxy_cache`) and gzip compression for high throughput.
  - DDoS rate limiting: 100 requests/sec per IP with burst buffer of 50.
- **Docker Compose Stack (`load-balancer/docker-compose.yml`)**:
  - Turnkey containerized stack deploying Redis (512MB LRU) + 3 PMCS application nodes + Nginx load balancer.
  ```bash
  cd load-balancer
  docker compose up --build
  ```

### 4. High-Availability Endpoints
- **Health Check (`GET /api/health`)**:
  - Returns real-time health metrics for load balancers (AWS ALB, Nginx, HAProxy, Kubernetes): system load average, memory usage, worker PID, cluster ID, and cache status.
- **Cached Metrics (`GET /api/metrics`)**:
  - Serves cached dashboard aggregations with 60-second TTL and HTTP `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`.

---

## Security & Performance Highlights

### Security Hardening
- 🔐 **Cryptographic Authentication**: SHA-256 password hashing with salt using the Web Crypto API.
- 🛡️ **Rate Limiting & Lockout**: Brute-force protection locking out repeated failed login attempts (5 attempts, 5-minute lockout).
- 📦 **Server-Side Route Guard (`proxy.ts`)**: Next.js 16 proxy intercepts unauthenticated requests on the server before rendering, eliminating Flash of Unauthenticated Content (FOUC).
- 🛑 **HTTP Security Headers**: Enforced CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and disabled `poweredByHeader`.

### Performance Optimizations
- ⚡ **Native SWC Compiler**: Removed legacy Babel configs to enable Next.js Turbopack / native SWC transformations.
- 🚫 **Client-Side SPA Navigation**: Replaced `window.location.href` full reloads with `useRouter().replace()`.
- 🔄 **Hydration-Safe Architecture**: Eliminated SSR/client hydration mismatches and React effect dependency loops.
- 📦 **Optimized Path Aliasing**: Configured clean `@/*` path mapping for TypeScript 7 compatibility.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 7
- **Caching**: Redis (`ioredis`) with in-memory TTL fallback
- **Cluster & Scaling**: Node.js Cluster Module (`node:cluster`)
- **Load Balancer**: Nginx (reverse proxy, rate-limiting, microcaching)
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest with `@testing-library/react` and `next/jest` (SWC runner)
- **Authentication**: Web Crypto API & session cookies

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Optional: Redis server (local or Docker)

### Installation
```bash
git clone https://github.com/the-wilful-youth/PMCS.git
cd PMCS
npm install
```

### Environment Configuration (Optional)
Create `.env.local` to customize cache and port settings:
```env
PORT=3000
REDIS_URL=redis://localhost:6379
# or leave unset to use automatic in-memory cache fallback
```

### Running Locally

**Standard Development Server:**
```bash
npm run dev
```

**High-Performance Multi-Worker Cluster (All CPU Cores):**
```bash
npm run cluster
```

**Production Build & Start:**
```bash
npm run build
npm start
# or start cluster mode:
npm run start:cluster
```

**Docker Compose High-Load Stack:**
```bash
cd load-balancer
docker compose up --build
```

---

## Testing

The project includes unit and integration tests:
```bash
# Run all test suites
npm test

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- `tests/auth.test.ts`: Password hashing, rate limiting, credential rejection, session parsing, and expiry.
- `tests/cache.test.ts`: Cache set/get, TTL expiry, cache invalidation, getOrSet pattern, and status reporting.
- `tests/login.page.test.tsx`: Form accessibility, error alert feedback, and authenticated redirects.
- `tests/app.page.test.tsx`: Dashboard rendering, role badges, and authenticated metrics.

---

## Project Structure

```
PMCS/
├── app/                      # Next.js 16 App Router
│   ├── activity/             # Activity audit log
│   ├── api/
│   │   ├── health/           # Health check endpoint for load balancers
│   │   └── metrics/          # Redis-cached dashboard metrics endpoint
│   ├── calendar/             # Calendar views (month/week/day)
│   ├── datasets/             # Dataset management
│   ├── documents/            # Document management & versioning
│   ├── issues/               # Issue/blocker tracking
│   ├── login/                # Authentication page
│   ├── meetings/             # Meeting management & action items
│   ├── milestones/           # Milestone tracking & progress calculation
│   ├── my-work/              # Personal workspace
│   ├── reports/              # Reporting system & export options
│   ├── research/             # Research paper repository
│   ├── tasks/                # Task management
│   ├── team/                 # Team management & new member onboarding
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Central dashboard
├── lib/                      # Shared business logic
│   ├── auth.ts               # Cryptographic auth, sessions, rate limiting
│   ├── cache.ts              # Redis + in-memory cache manager
│   └── redis.ts              # Redis client exports
├── load-balancer/            # Enterprise deployment configuration
│   ├── nginx.conf            # Nginx load balancer, rate limiting & cache
│   └── docker-compose.yml    # Redis + 3 app instances + Nginx stack
├── public/                   # Static assets
├── styles/                   # Global CSS
├── tests/                    # Jest test suites
│   ├── auth.test.ts
│   ├── cache.test.ts
│   ├── login.page.test.tsx
│   └── app.page.test.tsx
├── Dockerfile                # Multi-stage production Docker build
├── jest.config.mjs           # SWC-powered Jest configuration
├── jest.setup.js             # Environment polyfills
├── next.config.js            # Security headers & Next.js config
├── proxy.ts                  # Next.js 16 server route guard
├── server.js                 # Multi-worker cluster entrypoint
├── tsconfig.json             # TypeScript 7 configuration
└── package.json              # Dependencies and run scripts
```

---

## Initial Credentials (from `project.md`)

- **Admin Account:** `anurag` / `Admin@123456`
- **Member Accounts:** `divyanshi`, `tanishk`, or `prajjwal` / `Member@123456`

---

## License

This project is licensed under the ISC License.