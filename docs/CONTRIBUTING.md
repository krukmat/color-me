# Contributing — PR & Rollback Requirements (F05.2)

This document defines the minimum requirements for PRs and rollback planning, aligned with `CODEX.md` and the repository guardrails.

## Pull Request Requirements
Every PR must include:
1. **Goal**: a clear statement of intent.
2. **Approach**: how the change works and why it was chosen.
3. **Files touched**: the list of modified paths.
4. **Edge cases**: scenarios considered and how they are handled.
5. **Test plan**:
   - Commands executed (with outputs or evidence).
   - If tests were not run, explain why and include the exact commands that would run them.
6. **Risks**: technical or product risks introduced by the change.
7. **Rollback plan**: steps to revert or disable the change if needed.

## Testing Expectations
- Run `make lint` and `make test` before opening the PR when possible.
- If the environment prevents running tests, document the limitation.
- For ML-related changes, include unit tests and, when feasible, integration tests.

## Rollback Guidelines
- Keep changes scoped per PR and reversible.
- Prefer feature flags for endpoint or workflow switches.
- If the change affects contracts (request/response), version them or maintain compatibility.

## Logging & Privacy
- Do not log base64 strings or raw image bytes.
- Always include `request_id` inside error envelopes and logs.

## Evidence Format
Include a brief **Evidence** section in the PR:
- `Commands:` the list of commands executed.
- `Results:` summaries, important output lines, or links to test runs.
