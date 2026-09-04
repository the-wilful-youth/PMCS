<div align="center">

# PMCS — Project Management & Coordination System

**An enterprise-grade, high-concurrency, multi-project coordination workspace built with Next.js 16, TypeScript, React 19, and Redis.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Jest-26%20Tests%20Passing-brightgreen?logo=jest)](https://jestjs.io/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Supported-blueviolet?logo=turbopack)](https://turbo.build/)
[![Redis](https://img.shields.io/badge/Redis-Distributed%20Cache-red?logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Features](#key-features) • [Architecture](#architecture--scalability) • [Quick Start](#quick-start) • [API Reference](#api-reference) • [Contributing](#contributing)

</div>

---

## Executive Overview

**PMCS (Project Management & Coordination System)** is a comprehensive, production-ready workspace engineered for engineering teams, research institutions, and product organizations. It combines project tracking, team management, academic literature tracking, dataset governance, meeting action conversions, dynamic milestone computation, and issue triage into an intuitive single pane of glass.

Originally designed for academic systems research, PMCS has been generalized into a **universal multi-project coordination platform**: any user can register, spin up new project workspaces, assign teammates, track deliverables, and seamlessly toggle project contexts from anywhere in the app.

---

## Key Features

### 🏢 Multi-Project Workspace Management
- **Centralized Directory (`/projects`)**: Filter, search, and view all team initiatives, leads, deadlines, and project statuses (`Active`, `Planning`, `On Hold`, `Completed`).
- **Interactive Project Creator (`/projects/new`)**: Configure scopes, milestones, and assign registered team members with automatic administrator rights.
- **Dynamic Context Switcher**: A persistent header dropdown in `components/Navigation.tsx` allows one-click switching between "Global (All Projects)" and specific initiatives, dispatching reactive events across all open modules.

### 📊 Real-Time Executive Dashboard
- Health indicators calculated dynamically (`ON TRACK`, `AT RISK`, `CRITICAL`).
- Aggregated workload metrics: overall completion percentage, total tasks, overdue counts, in-progress workloads, and active blockers.
- Dynamically scopes metrics to the selected active project or across the entire workspace.

### 📋 Task & Kanban Tracking (`/tasks`)
- Kanban and list views with status toggles (`Not Started`, `In Progress`, `Ready for Review`, `Completed`, `Blocked`).
- Priority ratings (`High`, `Medium`, `Low`), effort estimates, worklogs, and dependency tracking.
- Context-aware creation: newly created tasks automatically bind to the active project context.

### 🎯 Dynamic Milestone Engine (`/milestones`)
- Visual progress bars dynamically calculated based on completed associated tasks.
- Target deadlines, success criteria arrays, and milestone ownership assignments.

### 🚨 Issue & Blocker Management (`/issues`)
- Severity levels (`Critical`, `High`, `Medium`, `Low`), status lifecycle (`Open`, `In Progress`, `Resolved`, `Closed`), and direct task linking.
- Audit trail logging and assignee triage.

### 👥 Team & Workload Analytics (`/team`)
- Member directory with role badges (`admin`, `member`, `reviewer`).
- Real-time workload calculations: task distribution, completed vs. in-progress ratios, and blocker tracking per contributor.

### 📚 Research & Literature Repository (`/research`)
- Academic publication index with citation metadata, DOI/URL links, relevance scoring, and paper reviewers.
- Full PDF/external reference tracking.

### 💾 Dataset Lifecycle Management (`/datasets`)
- Dual-status tracking: **Access Status** (`Requested`, `Approved`, `Acquired`) and **Analysis Status** (`Pending`, `In Progress`, `Processed`).
- Operating system and hardware platform compatibility tags.

### 🤝 Meetings & Action Item Conversions (`/meetings`)
- Structured agendas, discussion minutes, and recorded decisions.
- **One-Click Action Item Conversion**: Converts meeting action items into trackable Kanban tasks with pre-populated owners and deadlines.

### 📅 Unified Calendar & Reports
- **Calendar (`/calendar`)**: Aggregated timeline synchronizing task deadlines, team meetings, and major milestones in Month/Week/Day views.
- **Reporting System (`/reports`)**: On-demand summaries for project status, member contributions, research progress, and issues.
- **Audit Trail (`/activity`)**: Immutable historical log of all changes across projects, tasks, issues, and milestones.

---

## Architecture & Scalability

PMCS is engineered for high-concurrency environments and enterprise scale:

```
                              ┌─────────────────────────────┐
                              │     Nginx Load Balancer     │
                              │  (least_conn, microcaching) │
                              └──────────────┬──────────────┘
                                             │
                   ┌─────────────────────────┼─────────────────────────┐
                   ▼                         ▼                         ▼
          ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
          │  PMCS Worker 1  │       │  PMCS Worker 2  │       │  PMCS Worker N  │
          │ (Node.js Core)  │       │ (Node.js Core)  │       │ (Node.js Core)  │
          └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
                   │                         │                         │
                   └─────────────────────────┼─────────────────────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          ▼                                     ▼
                ┌───────────────────┐                 ┌───────────────────┐
                │   Redis Cluster   │ ──(fallback)──► │ In-Memory LRU TTL │
                │ (Cache Layer)     │                 │   (Zero Config)   │
                └───────────────────┘                 └───────────────────┘
                                             │
                                             ▼
                                ┌────────────────────────┐
                                │   Persistent DB Layer  │
                                │    (Atomic File DB)    │
                                └────────────────────────┘
```

### 1. Multi-Worker Clustered Supervisor (`server.js`)
- Utilizes the Node.js native `cluster` module to saturate **all available CPU cores**.
- Kernel IPC load balancing distributes incoming HTTP requests across worker threads.
- **Self-Healing Supervisor**: Automatically detects worker termination and spawns replacements with zero downtime.

### 2. Dual-Tier Distributed Caching (`lib/cache.ts`)
- High-performance caching layer powered by `ioredis`.
- **Automatic Graceful Fallback**: If Redis is not running or network connectivity drops, the system falls back to an ultra-fast in-memory TTL cache with LRU eviction without throwing unhandled exceptions.
- `cache.getOrSet()` pattern prevents cache stampedes under heavy traffic spikes.

### 3. Production Reverse Proxy & Load Balancer (`load-balancer/`)
- **Nginx (`load-balancer/nginx.conf`)**:
  - `least_conn` load balancing across application nodes.
  - HTTP keepalive connection pooling (`keepalive 64`).
  - Microcaching (`proxy_cache`) and gzip compression for high throughput.
  - DDoS rate limiting: 100 req/sec per IP with a burst buffer of 50.
- **Docker Compose Stack (`load-balancer/docker-compose.yml`)**: Turnkey local production stack with Redis + 3 PMCS application nodes + Nginx load balancer.

### 4. Zero-Dependency Cryptographic Security
- Cryptographic SHA-256 password hashing with unique salts using native Node.js / Web Crypto API (no brittle native C++ addons).
- Rate-limiting protection locking out repeated failed login attempts (5 attempts, 5-minute lockout).
- Proxy route guard in `proxy.ts` eliminating Flash of Unauthenticated Content (FOUC).
- Hardened HTTP security headers: CSP, HSTS, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.

---

## Quick Start

### Prerequisites
- **Node.js**: v18.17.0 or higher (v20+ recommended)
- **npm** or **pnpm** / **yarn**
- *(Optional)* **Docker & Docker Compose** for multi-container deployments

### 1. Clone & Install
```bash
git clone https://github.com/the-wilful-youth/PMCS.git
cd PMCS
npm install
```

### 2. Environment Configuration
Copy the configuration template:
```bash
cp .env.example .env.local
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment & Production Options

### Option A: Clustered Node Server (All CPU Cores)
```bash
npm run build
npm run start:cluster
```

### Option B: Standard Next.js Production Server
```bash
npm run build
npm start
```

### Option C: Turnkey Docker Compose Stack (Nginx + Redis + PMCS Nodes)
```bash
cd load-balancer
docker compose up --build
```
Access the application through the load balancer at `http://localhost:80`.

---

## API Reference

PMCS provides a RESTful API with JSON payloads:

### Authentication & Users
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user and issue session cookie | No |
| `POST` | `/api/auth/signup` | Register a new user account with admin rights | No |
| `GET` | `/api/auth/me` | Fetch active user session information | Yes |
| `GET` | `/api/auth/users` | List all registered workspace users | Yes |

### Projects & Dashboard
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/projects` | List all projects (or projects user is member of) | Yes |
| `POST` | `/api/projects` | Create a new project with lead and members | Admin |
| `GET` | `/api/dashboard` | Aggregated dashboard metrics (accepts `?projectId=...`) | Yes |
| `GET` | `/api/metrics` | Cached metrics endpoint with 60-second TTL | Yes |
| `GET` | `/api/health` | Health check probe (CPU, memory, worker, cache) | No |

### Tasks & Team
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/tasks` | List tasks (filterable by `projectId`, `status`, `assignee`) | Yes |
| `POST` | `/api/tasks` | Create a new task in active project | Yes |
| `PUT` | `/api/tasks/[id]` | Update task status, assignee, or effort | Yes |
| `DELETE` | `/api/tasks/[id]` | Delete a task | Yes |
| `GET` | `/api/team` | Team directory with real-time workload stats | Yes |
| `POST` | `/api/team` | Add a new team member | Admin |

### Milestones, Issues & Meetings
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/milestones` | List all milestones and computed progress | Yes |
| `POST` | `/api/milestones` | Create a new project milestone | Yes |
| `GET` | `/api/issues` | List all issues and blockers | Yes |
| `POST` | `/api/issues` | Log a new issue | Yes |
| `GET` | `/api/meetings` | List meeting logs and action items | Yes |
| `POST` | `/api/meetings` | Record a new team meeting | Yes |
| `POST` | `/api/meetings/[id]/convert-action` | Convert meeting action item into a Kanban task | Yes |

### Knowledge & Audit
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/documents` | List documentation and version histories | Yes |
| `GET` | `/api/research` | List academic papers and literature reviews | Yes |
| `GET` | `/api/datasets` | List dataset acquisitions and analysis statuses | Yes |
| `GET` | `/api/reports` | Export analytical reports | Yes |
| `GET` | `/api/activity` | Immutable audit trail of workspace events | Yes |

---

## Pre-Seeded Accounts

For instant testing and evaluation, PMCS includes pre-configured credentials:

| Username | Password | Role | Description |
|---|---|---|---|
| `anurag` | `Admin@123456` | Project Admin | Workspace Administrator |
| `divyanshi` | `Member@123456` | Team Member | Collaborator & Developer |
| `tanishk` | `Member@123456` | Team Member | Collaborator & Developer |
| `prajjwal` | `Member@123456` | Team Member | Collaborator & Developer |

*(New accounts can also be created at any time using the **Create Account** tab on `/login`.)*

---

## Testing & Quality Assurance

PMCS maintains a comprehensive automated testing suite:

```bash
# Run all test suites
npm test

# Run tests in interactive watch mode
npm run test:watch
```

### Test Suites Included:
- **`tests/projects.test.ts`**: Multi-project management, project isolation, metrics calculation, and cryptographic hashing.
- **`tests/auth.test.ts`**: Web Crypto SHA-256 verification, rate-limiting lockouts, credential validation, session parsing, and expiry.
- **`tests/cache.test.ts`**: Redis operations, in-memory TTL fallback, cache invalidation, and `getOrSet` stampede prevention.
- **`tests/backend.test.ts`**: Persistent DB initialization, meeting action-to-task conversion, and audit logging.
- **`tests/login.page.test.tsx`**: Accessibility testing, error alerts, and authentication state transitions.
- **`tests/app.page.test.tsx`**: Executive dashboard rendering, role badges, and authenticated metric displays.

---

## Contributing

We welcome contributions! Please review our [**Contributing Guide (CONTRIBUTING.md)**](./CONTRIBUTING.md) for detailed instructions on:
- Setting up your local environment
- Development standards and conventions
- Submitting pull requests
- Branch naming and commit message format

---

## License

This project is licensed under the [MIT License](./package.json).