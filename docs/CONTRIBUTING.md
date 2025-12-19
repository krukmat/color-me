# Contributing — PR & Rollback Requirements (F05.2)

This document defines the minimum requirements for PRs and rollback planning, aligned with `CODEX.md` and repository guardrails.

## Pull Request Requirements
Every PR must include:
1. **Goal**: clear statement of intent.
2. **Approach**: how the change works and why.
3. **Files touched**: list of modified paths.
4. **Edge cases**: scenarios considered and how they are handled.
5. **Test plan**:
   - Commands run (with outputs or evidence).
   - If tests not run, explain why and provide exact commands.
6. **Risks**: technical or product risks introduced.
7. **Rollback plan**: steps to revert or disable the change.

## Testing Expectations
- Run `make lint` and `make test` before PR when possible.
- If the environment prevents running tests, document the reason.
- For ML changes: include unit tests and, when possible, integration tests.

## Rollback Guidelines
- Keep changes PR-scoped and reversible.
- Prefer feature flags for endpoint/flow switches.
- If the change affects contracts (request/response), version or preserve compatibility.

## Logging & Privacy
- Do not log base64 or raw image bytes.
- Always include `request_id` in error envelopes and logs.

## Evidence Format
Include a brief **Evidence** section in the PR:
- `Commands:` list of commands run.
- `Results:` summaries or key output lines.
