# Infra Plan — F05.1 Discovery

This document captures the current infra state and the minimal deployment/compose artifacts needed to support the stack. It is intentionally focused on infrastructure and deployment concerns only.

## Current State
- No `infra/` directory exists in the repository.
- `docker-compose.yml` and root `Makefile` are now present.
- `.env.example` exists for environment defaults.
- `scripts/verify.sh` exists and runs lint/tests per package.

## Required Artifacts (MVP)
1. **Local compose** (`docker-compose.yml`)
   - Services: `bff`, `ml-api`
   - Optional: storage for output images (local volume or MinIO)
   - Network: shared internal network
2. **Makefile**
   - `make dev`: starts compose
   - `make lint`: runs `scripts/verify.sh`
   - `make test`: runs `scripts/verify.sh`
3. **Env templates**
   - `.env.example` in root
   - Required keys: `ML_API_URL`, `ALLOWED_ORIGIN`, `PORT`, `RATE_LIMIT_*`
4. **Output image strategy**
   - TTL-based store for processed outputs (no input selfies stored)
   - Options: local disk (dev), S3-compatible (prod)
5. **Ops docs**
   - Basic runbook: build, run, stop, rollback
   - Health checks and smoke tests (curl endpoints)

## Decision Points (Blockers)
- Output `image_url` storage backend (local vs S3-compatible).
- Whether to add a reverse proxy (nginx/traefik) for local TLS/cors parity.
- CI/CD integration location (GitHub Actions or external runner).

## Decision (current)
- **Dev**: local output store with TTL (filesystem or in-memory) served by ML API (`GET /images/{id}`).
- **Prod**: S3-compatible storage (e.g., MinIO/S3) with short-lived signed URLs or CDN-backed TTL.
- **Inputs**: never persisted, only processed outputs with TTL.

## Next Steps
1. Choose output storage backend and TTL strategy.
2. Document deployment workflow and rollback in `docs/infra-plan.md`.
3. Add `infra/` directory if infra scripts/IaC are introduced.

When these artifacts land, update `docs/phase-map.md` and tag F05.1 as completed.
