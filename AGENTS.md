# Repository Guidelines

## Project Structure & Module Organization
- `apps/mobile/`: React Native Android client. Keep UI, service calls, and utilities separated; follow TypeScript + RN idioms.
- `services/bff/`: Express TypeScript gateway. Validation, rate limiting, and HTTP orchestration live here.
- `services/ml-api/`: FastAPI image pipeline. Separate validation, pure image transforms, and cached model loading.
- `infra/` and `docs/` (when present) hold deployment scripts, compose files, and architectural notes.
- Tests live alongside their packages (`services/*/tests` or `apps/mobile/__tests__`). Favor colocated fixtures.

## Build, Test, and Development Commands
- `make dev`: boots the default stack for local experimentation (web, BFF, ML API); use as your starting point.
- `make lint`: runs repository-wide linters; expect zero lint failures before a PR.
- `make test`: executes unit suites across packages when available.
- `services/bff`: `npm run dev` spins the Express server; `npm test` runs Supertest/validation suites.
- `services/ml-api`: `uvicorn app.main:app --reload` for development, `pytest` for FastAPI unit/integration tests.
- `apps/mobile`: `npm run android` launches the RN Android bundle.

## Coding Style & Naming Conventions
- Follow the repo’s principle of KISS, DRY, and SOC. Prefer clear, named functions for transforms and validation helpers.
- Use 2 spaces for indentation in TypeScript and Python codebases; keep TypeScript strict.
- Naming pattern: `PascalCase` for components/classes, `camelCase` for functions/variables, `SCREAMING_SNAKE_CASE` for constants.
- Run the configured formatter/linter before commits (e.g., `make lint`). Keep logging JSON-like and avoid base64/image data in logs.

## Testing Guidelines
- FastAPI tests use `pytest` with fixtures that mirror real image flows; cover recolor/post-process logic and the main endpoint.
- BFF suites rely on Supertest or zod validation unit tests; assert error envelopes (`code`, `message`, `request_id`, `details`) consistently.
- Mobile logic tests focus on pure logic (no UI e2e yet). Keep names like `describe('xxx service')`.
- Run `make test` for a broad sweep; otherwise run package-specific commands above before PR.

## Commit & Pull Request Guidelines
- Favor single-purpose commits that mirror the PR scope; mention planning, decisions, and tests in the message.
- PRs must include: goal, approach, touched files, edge cases, test plan, risks, and rollback plan (per CODEX pre-flight). Link to relevant issues if available.
- Describe command outputs and provide evidence for tests run. Keep PRs small and incremental.

## Security & Agent Notes
- Selfies/images: do not persist by default, never log base64 or raw bytes.
- Propagate `x-request-id` through BFF → ML API for traceability; include `request_id` in error envelopes.
- Cache models in `services/ml-api` and reject oversized payloads early.
