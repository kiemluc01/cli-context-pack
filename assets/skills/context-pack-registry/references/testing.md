# Testing Strategy

| Component | Test style | Must cover |
|---|---|---|
| Detector | Fixture repositories on disk | Each manifest type, mixed stacks, missing or malformed manifests, byte-identical output across runs |
| Resolvers (skill, context) | Pure unit tests with fixture registries | Filtering, scope overrides, policy locks, conflicts, tie-breaking, deprecated exclusion, deterministic ordering |
| Memory domain | Unit tests on the state machine | Every allowed and forbidden transition, role checks, supersede, freshness changes |
| Repositories | Real PostgreSQL (testcontainers or ephemeral schema), not mocked SQL | Queries, indexes used by search, transactions, constraint violations, pagination stability |
| MCP tools | Handler plus contract tests | Schema validation, MEMBER/LEAD authz, error codes, limits and pagination, redaction |
| CLI commands | Command tests in temporary directories | `--json` output, exit codes, idempotency (run twice, assert no diff), read-only commands write nothing, Windows paths |
| Capture | Unit tests with diff fixtures | Secret redaction, provenance fields, CANDIDATE only, dedupe flagging |
| Integrity | Unit tests | CRLF/LF equivalence, multi-file hashing, mismatch reporting |
| Hooks | Scripted tests in a temporary git repo | PASS and BLOCK paths per check, redacted output, staged-only behavior |

**Dimensions for every changed behavior:** happy path, boundary, invalid, empty, null/undefined, authorization, error handling, regression, domain edge cases. Search: exact, contains, case sensitivity, empty keyword, special characters, Unicode and accents, pagination interaction, no result, large result set. APIs: 200/400/401/403/404/409/500 where applicable.

**Quality bar:** assert outcomes - return values, state, persisted rows, emitted events, external calls, errors, permissions. A test that only executes code is not coverage. Coverage targets apply to changed code; measuring is in `workflows/testing.md`.

**Regression:** when behavior changes intentionally, update the test to the new explicit requirement and say so in the completion report. Never delete a failing test to get green.
