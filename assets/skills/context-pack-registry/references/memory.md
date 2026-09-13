# Memory

Historical development knowledge, **not** canonical truth. Lives in PostgreSQL behind the MCP server so the whole team and every agent share it.

## Lifecycle `OBSERVED → CANDIDATE → VERIFIED → CANONICAL → DEPRECATED`

| Transition | Who | Preconditions | Side effects |
|---|---|---|---|
| (new) → OBSERVED | Capture pipeline, any authenticated member | Provenance recorded | none |
| OBSERVED → CANDIDATE | MEMBER or LEAD (`memory_register`, `ctxpack memory register`) | Title, body, type, at least one evidence item | audit row |
| CANDIDATE → VERIFIED | LEAD | Evidence reviewed | audit row, `lastVerifiedAt` set |
| VERIFIED → CANONICAL | LEAD | A canonical context artifact exists in Git (path@commit) | `canonicalRef` stored, audit row |
| any non-DEPRECATED → DEPRECATED | LEAD | Reason provided | audit row; linked canonical context marked `deprecated` in Git through a PR |

- Forward only. Correct a memory by creating one that `supersedes` it, then deprecate the old one.
- Nothing auto-promotes; AI confidence never changes lifecycle state.
- Rejecting a candidate is unspecified: model it as DEPRECATED with reason `rejected` unless the user decides otherwise. **Open question: confirm before building a separate REJECTED state.**
- Hard deletion only through an explicit governance policy (e.g. legal removal, leaked secret), itself audited.

Example: candidate "Redis was added to prompt cache" is verified; a LEAD publishes context "Prompt cache uses Redis." When Redis is removed, that context becomes `deprecated`; memory and old context stay queryable as history.

## Freshness (orthogonal to lifecycle)

`FRESH | POTENTIALLY_STALE`. Each memory links affected files, modules and a source commit; a later commit changing a linked file or module sets `POTENTIALLY_STALE`. Never delete or demote automatically. LEAD re-verification resets freshness and `lastVerifiedAt`. Operations needing fresh knowledge may fail with `STALE_MEMORY`.

## Provenance

Store what is available: project, repository, module, author, commit, PR, changed files, evidence, createdAt, generatedAt, model, confidence, verificationState. Whenever AI produced the text, `model`, `confidence`, `generatedAt` are mandatory so every AI claim is traceable.

## Decision memory

`type: decision` requires `decision`, `reason`, `alternatives`, `tradeoffs`, and a `source` (PR or commit). Without a reason it is rejected at validation - its value is the *why*. Template: `templates/memory.yaml`.

## Capture

Inputs: git diff, commit, PR, changed files, tests, existing context, dependencies. Output: **candidate** memory only.

Pipeline: collect → **redact secrets** (reuse `hooks/check-secrets` patterns; captured memory is shared, so a leak spreads to the whole team) → extract (deterministic metadata first, optional AI for summaries and decisions) → attach provenance → register as CANDIDATE → dedupe against existing memories by module and title, flagging duplicates instead of merging.

Commands: `ctxpack capture --from-git`, `ctxpack memory capture`, `ctxpack memory register`.

## Storage sketch (PostgreSQL; adapt to the existing schema)

- `memories` — id, project_id, module, type, title, body, lifecycle, freshness, supersedes_id, canonical_ref, provenance (jsonb), created_by, created_at, updated_at, last_verified_at
- `memory_links` — memory_id, kind (file/module/commit/pr/dependency), ref
- `memory_transitions` — memory_id, from_state, to_state, actor, role, reason, at (append-only audit)

Search without a vector DB: PostgreSQL full-text (`tsvector`, GIN index) plus filters on project, module, type, lifecycle. `pg_trgm` or `unaccent` are acceptable for typo tolerance or accent-insensitivity (e.g. Vietnamese) - ask first, they are infrastructure changes.

Default reads: non-DEPRECATED, newest first, small limit; history through an explicit flag.
