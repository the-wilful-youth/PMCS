# PMCS Deployment & Architecture Guide

## Executive Summary

The persistence layer, REST APIs, real-time activity auditing, and role-based permissions have been fully implemented, integrated, and verified for the **Project Management & Coordination System (PMCS)**.

---

## 1. Architecture & Persistence Layer (`lib/db.ts`)

- **Embedded Persistent Database**: Thread-safe, atomic file-backed JSON data store (`data/pmcs.json`) with atomic temporary-file swapping to eliminate corruption risk.
- **Zero-External DB Dependency**: Out-of-the-box readiness without requiring external PostgreSQL or Redis daemons, while retaining pluggable distributed Redis caching support (`lib/cache.ts`).
- **Initial Seed Data**: Pre-seeded with project data, team members, tasks, milestones, issues, documents, research papers, datasets, and meeting records based on academic research project standards.
- **Multi-Project Isolation**: Computes dashboard analytics, milestones, and task views isolated by `projectId` or aggregated across all projects.

---

## 2. Implemented REST API Endpoints (`app/api/...`)

- **Authentication & User Directory**:
  - `POST /api/auth/login`: Issue session cookie with rate-limiting protection.
  - `POST /api/auth/signup`: Open self-service registration.
  - `GET /api/auth/me`: Current session user profile.
  - `GET /api/auth/users`: List users for dropdowns & task assignees.
- **Projects & Multi-Tenant Management**:
  - `GET /api/projects`: List projects accessible to user.
  - `POST /api/projects`: Create new project with designated lead and members.
- **Core Entity CRUD & Lifecycle**:
  - `GET /api/tasks`, `POST /api/tasks`: Filter by status, assignee, priority, and `projectId`. Auto-generates `T-XXX` IDs.
  - `GET /api/tasks/[id]`, `PUT /api/tasks/[id]`, `DELETE /api/tasks/[id]`: Status changes, comments, and worklogs.
  - `GET /api/milestones`, `POST /api/milestones`: Target date tracking, success criteria.
  - `GET /api/milestones/[id]`, `PUT /api/milestones/[id]`, `DELETE /api/milestones/[id]`: Progress and status updates.
  - `GET /api/issues`, `POST /api/issues`: Blocker tracking, severity scoring (Critical, High, Medium, Low).
  - `GET /api/issues/[id]`, `PUT /api/issues/[id]`, `DELETE /api/issues/[id]`: Resolutions and status management.
  - `GET /api/documents`, `POST /api/documents`: Versioning, categories, and Drive links.
  - `GET /api/documents/[id]`, `PUT /api/documents/[id]`, `DELETE /api/documents/[id]`.
  - `GET /api/research`, `POST /api/research`: Literature papers, key findings, and venues.
  - `GET /api/research/[id]`, `PUT /api/research/[id]`, `DELETE /api/research/[id]`.
  - `GET /api/datasets`, `POST /api/datasets`: Access status & analysis status tracking.
  - `GET /api/datasets/[id]`, `PUT /api/datasets/[id]`, `DELETE /api/datasets/[id]`.
  - `GET /api/meetings`, `POST /api/meetings`: Meeting minutes, agendas, and action items.
  - `GET /api/meetings/[id]`, `PUT /api/meetings/[id]`, `DELETE /api/meetings/[id]`.
  - `POST /api/meetings/[id]/convert-action`: Converts meeting action items into formal project tasks.
  - `GET /api/team`, `POST /api/team`: Member workload metrics and user invitations.
  - `PUT /api/team/[id]`, `DELETE /api/team/[id]`: Role assignments (admin, member, reviewer).
  - `GET /api/activity`: Full audit trail of project actions.
  - `GET /api/dashboard`: Aggregated completion rates, workload, overdue tasks, and health status (`ON TRACK`, `AT RISK`, `CRITICAL`).
  - `GET /api/reports`: Comprehensive progress, member contribution, and asset reports.
  - `GET /api/health`: Node.js cluster, memory, and cache diagnostics.

---

## 3. High-Concurrency Scaling & Clustering

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
```

- **Clustering (`server.js`)**: Spawns workers matching `os.cpus().length` and balances traffic via Node.js kernel IPC.
- **Dual-Tier Cache (`lib/cache.ts`)**: Redis caching with sub-millisecond in-memory fallback.
- **Load Balancer (`load-balancer/nginx.conf`)**: Least-connection scheduling, HTTP keepalive pools, gzip compression, and rate limiting.

---

## 4. Production Runbook

### Clustered Node Server
```bash
npm run build
npm run start:cluster
```

### Docker Compose Multi-Node Stack
```bash
cd load-balancer
docker compose up --build -d
```

### Health Check Verification
```bash
curl http://localhost:3000/api/health
```
Example response:
```json
{
  "status": "healthy",
  "uptime": 128.45,
  "pid": 42110,
  "cluster": {
    "isWorker": true,
    "workerId": 1
  },
  "cache": {
    "connected": false,
    "driver": "memory-fallback"
  },
  "timestamp": "2026-09-05T01:00:00.000Z"
}
```
