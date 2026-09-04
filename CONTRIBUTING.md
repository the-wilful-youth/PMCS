# Contributing to PMCS

Thank you for your interest in contributing to **PMCS (Project Management & Coordination System)**! Whether you are fixing a bug, adding new features, improving documentation, or optimizing performance, your contributions are welcome.

This guide provides a comprehensive overview of the repository structure, architecture, development workflow, and testing standards to help you get up to speed quickly.

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Directory Structure](#directory-structure)
3. [Prerequisites & Quick Setup](#prerequisites--quick-setup)
4. [Development Workflows](#development-workflows)
5. [Core Architectural Patterns](#core-architectural-patterns)
   - [Multi-Project Data Scoping](#multi-project-data-scoping)
   - [Zero-Dependency Cryptographic Auth](#zero-dependency-cryptographic-auth)
   - [High-Concurrency Clustering & Caching](#high-concurrency-clustering--caching)
6. [Testing & Quality Assurance](#testing--quality-assurance)
7. [Coding Standards & Conventions](#coding-standards--conventions)
8. [Submitting Pull Requests](#submitting-pull-requests)

---

## Architectural Overview

PMCS is engineered as a modern, full-stack Next.js application that scales from single-developer local installations up to clustered, load-balanced enterprise deployments:

```
                  ┌─────────────────────────────────────┐
                  │          Nginx Load Balancer        │
                  │       (least_conn, microcaching)    │
                  └──────────────────┬──────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │ PMCS Worker 1   │       │ PMCS Worker 2   │       │ PMCS Worker N   │
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

---

## Directory Structure

```text
PMCS/
├── app/                        # Next.js App Router
│   ├── api/                    # RESTful API Route Handlers
│   │   ├── activity/           # Audit trail activity logging
│   │   ├── auth/               # Login, signup, me, and user directory
│   │   ├── dashboard/          # Metrics and summary endpoints
│   │   ├── datasets/           # Dataset tracking CRUD
│   │   ├── documents/          # Document management CRUD
│   │   ├── health/             # Health checks & probe endpoints
│   │   ├── issues/             # Issue tracking CRUD
│   │   ├── meetings/           # Meeting records & action conversions
│   │   ├── milestones/         # Milestones and progress tracking
│   │   ├── projects/           # Multi-project directory & management
│   │   ├── reports/            # Analytical reports & export data
│   │   ├── research/           # Research papers & literature tracker
│   │   ├── tasks/              # Kanban and task management CRUD
│   │   └── team/               # Team members & workload analytics
│   ├── activity/               # Audit trail viewer page
│   ├── calendar/               # Unified calendar view
│   ├── datasets/               # Dataset status & metadata page
│   ├── documents/              # Document repository page
│   ├── issues/                 # Issue tracking page
│   ├── login/                  # Authentication & self-service registration
│   ├── meetings/               # Meeting notes & action items page
│   ├── milestones/             # Milestone timeline & progress page
│   ├── my-work/                # Individual personal task hub
│   ├── projects/               # Projects directory & creation wizard
│   ├── reports/                # Project reporting & summaries
│   ├── research/               # Academic literature tracking page
│   ├── tasks/                  # Task board & list view
│   ├── team/                   # Team directory & member management
│   ├── layout.tsx              # Root HTML & navigation shell
│   └── page.tsx                # Executive Dashboard view
├── components/                 # Reusable UI Components
│   └── Navigation.tsx          # Global top-bar & project switcher
├── data/                       # Local persistent storage
│   └── pmcs.json               # Auto-initialized schema and seed data
├── lib/                        # Core Application Libraries
│   ├── auth.ts                 # Client/server auth, sessions & crypto
│   ├── cache.ts                # Dual-tier Redis & in-memory cache manager
│   ├── db.ts                   # Database schema, operations & metrics
│   ├── redis.ts                # Robust Redis client connection manager
│   └── server-auth.ts          # Server-side route authentication helpers
├── load-balancer/              # Infrastructure Configuration
│   ├── docker-compose.yml      # Multi-container local production stack
│   └── nginx.conf              # Reverse proxy, caching & rate limiting
├── tests/                      # Jest & React Testing Library Suites
│   ├── app.page.test.tsx       # Dashboard UI unit tests
│   ├── auth.test.ts            # Authentication & session unit tests
│   ├── backend.test.ts         # Database operations & metric unit tests
│   ├── cache.test.ts           # Distributed & fallback cache tests
│   ├── login.page.test.tsx     # Login & registration UI tests
│   └── projects.test.ts        # Multi-project management tests
├── Dockerfile                  # Production container image definition
├── next.config.js              # Next.js security headers & Turbopack config
├── package.json                # Project dependencies and npm scripts
├── server.js                   # Multi-core clustered supervisor server
└── tsconfig.json               # TypeScript compiler configuration
```

---

## Prerequisites & Quick Setup

### System Requirements
- **Node.js**: v18.17.0 or newer (v20+ recommended)
- **npm**: v9+ (or **pnpm** / **yarn**)
- **OS**: macOS, Linux, or Windows (WSL2 recommended on Windows)
- **Optional**: Docker & Docker Compose (for containerized stack testing)

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/the-wilful-youth/PMCS.git
   cd PMCS
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example template:
   ```bash
   cp .env.example .env.local
   ```
   *(All variables have defaults; no mandatory external services are required to run locally.)*

4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run the Test Suite**:
   ```bash
   npm test
   ```

---

## Development Workflows

### Available NPM Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Next.js development server with hot reload |
| `npm run build` | Compiles production bundle and checks TypeScript types |
| `npm run start` | Runs the compiled production build in single-process mode |
| `npm run cluster` | Runs the multi-worker cluster server in development mode |
| `npm run start:cluster` | Runs the multi-worker cluster in production mode across all CPUs |
| `npm test` | Executes all Jest unit and integration test suites |
| `npm run test:watch` | Runs Jest in interactive watch mode during development |

### Multi-Worker Cluster Testing
To test PMCS under multi-core concurrency matching production:
```bash
npm run build
npm run start:cluster
```

### Docker Compose Stack
To spin up Redis, multiple PMCS application nodes, and Nginx reverse proxy:
```bash
cd load-balancer
docker compose up --build
```

---

## Core Architectural Patterns

### 1. Multi-Project Data Scoping
PMCS supports multiple projects simultaneously. When implementing new features or endpoints:
- Use `projectId` parameter to filter queries:
  ```ts
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (projectId && projectId !== 'all') {
    items = items.filter(item => item.projectId === projectId);
  }
  ```
- Store the active project selection in `localStorage` under `pmcs_active_project_id`.
- Dispatch the `pmcs-project-changed` CustomEvent so open views update reactively without a full page refresh:
  ```ts
  window.dispatchEvent(new CustomEvent('pmcs-project-changed', {
    detail: { projectId, projectName }
  }));
  ```

### 2. Zero-Dependency Cryptographic Auth
To ensure fast and reliable installation across all platforms (macOS, Linux, Windows), PMCS uses native **Web Crypto API / Node.js SHA-256** with unique salts.
- **Do not introduce native C++ binary addons** (such as `bcrypt` or `argon2-node`) that require local compiler toolchains.
- Always use `sha256()` from `@/lib/auth`.
- Protect sensitive API routes using `requireAuth()` or `requireAdmin()` from `@/lib/server-auth`.

### 3. High-Concurrency Clustering & Caching
- **Redis Cache Manager (`lib/cache.ts`)**:
  Wrap heavy analytical queries using `cache.getOrSet(key, fetcher, ttlSeconds)`.
  ```ts
  const data = await cache.getOrSet(`metrics:${projectId}`, async () => {
    return computeHeavyMetrics(projectId);
  }, 120);
  ```
- If Redis is down, `CacheManager` gracefully falls back to memory without crashing.

---

## Testing & Quality Assurance

Every contribution must pass the automated test suite and compile cleanly:

1. **Run Unit Tests**:
   ```bash
   npm test
   ```
2. **Verify Production Build**:
   ```bash
   npm run build
   ```
3. **Write New Tests**:
   - Place unit tests in `tests/`.
   - Name test files `*.test.ts` or `*.test.tsx`.
   - Mock Next.js navigation with `useRouter` when testing client components.
   - Ensure backward compatibility with existing tests and demo accounts.

---

## Coding Standards & Conventions

### TypeScript & React
- **TypeScript**: Strict type definitions. Avoid using `any` wherever possible.
- **Client Components**: Explicitly add `'use client';` at the top of client-side React files.
- **CSS / Styling**: Clean, accessible, responsive styling matching the design tokens in existing components.
- **Semantic HTML**: Use proper accessibility labels (`aria-label`, `htmlFor`, `<button type="button">` vs `<button type="submit">`).

### Git Commit Guidelines
We follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>
```

**Types**:
- `feat`: A new user-facing feature or enhancement
- `fix`: A bug fix
- `docs`: Documentation updates or additions
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests
- `perf`: A code change that improves performance
- `chore`: Build process, dependencies, or tooling changes

**Example**:
```bash
git commit -m "feat(projects): add archive project action and status badge"
```

---

## Submitting Pull Requests

1. **Fork the repository** on GitHub.
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Implement your changes** and write corresponding tests.
4. **Ensure all tests pass and build succeeds**:
   ```bash
   npm test
   npm run build
   ```
5. **Commit your changes** with descriptive commit messages.
6. **Push to your fork**:
   ```bash
   git push origin feat/your-feature-name
   ```
7. **Open a Pull Request** against the `main` branch with a clear description of your changes, context, and any testing performed.

Thank you for helping make PMCS better for everyone!
