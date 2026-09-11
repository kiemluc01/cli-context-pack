# Memory

Memory is historical and development knowledge learned while building the project. It is **not** canonical truth. It lives in PostgreSQL behind the MCP server so the whole team and every agent share it.

## Lifecycle

```
OBSERVED → CANDIDATE → VERIFIED → CANONICAL → DEPRECATED
```

| Transition | Who | Preconditions | Side effects |
|---|---|---|---|
| (new) → OBSERVED | Capture pipeline, any authenticated member | Provenance recorded | none |
| OBSERVED → CANDIDATE | MEMBER or LEAD (`memory_register`, `ctxpack memory register`) | Title, body, type, at least one evidence item | audit row |
| CANDIDATE → VERIFIED | LEAD | Evidence reviewed | audit row, `lastVerifiedAt` set |
| VERIFIED → CANONICAL | LEAD | A canonical context artifact exists in Git (path@commit) | `canonicalRef` stored, audit row |
| any non-DEPRECATED → DEPRECATED | LEAD | Reason provided | audit row; linked canonical context is marked `deprecated` in Git through a PR |

Rules:
- Transitions only move forward. To correct a memory, create a new one that `supersedes` the old one, and deprecate the old one.
- Nothing auto-promotes. AI confidence never changes lifecycle state.
- Rejecting a candidate is not in the specification. Model it as DEPRECATED with reason `rejected` unless the user decides otherwise. **Open question: confirm before building a separate REJECTED state.**
- Hard deletion happens only through an explicit governance policy (for example, legal removal or leaked secret) and is itself audited.

Example: the candidate memory "Redis was added to prompt cache" is verified, and a LEAD publishes the canonical context "Prompt cache uses Redis." When Redis is later removed, that context becomes `deprecated`, and both the memory and the old context remain queryable as history.

## Freshness (orthogonal to lifecycle)

`FRESH | POTENTIALLY_STALE`. Each memory links to affected files, modules and a source commit. When a later commit changes a linked file or module, set `POTENTIALLY_STALE`. Never delete or demote automatically. Re-verification by a LEAD resets freshness and `lastVerifiedAt`. Operations that require fresh knowledge may fail with `STALE_MEMORY`.

## Provenance

Store whatever is available: project, repository, module, author, commit, PR, changed files, evidence, createdAt, generatedAt, model, confidence, verificationState. AI-generated fields (`model`, `confidence`, `generatedAt`) are mandatory whenever AI produced the text, so every AI claim can be traced.

## Decision memory

`type: decision` requires `decision`, `reason`, `alternatives`, `tradeoffs`, and a `source` (PR or commit). A decision without a reason is rejected at validation because its whole value is the *why*. Template: `templates/memory.yaml`.

## Capture

Inputs: git diff, commit, PR, changed files, tests, existing context, dependencies. Output: **candidate** memory only.

Pipeline: collect → **redact secrets** (reuse the secret patterns from `hooks/check-secrets`; captured memory is shared, so a leak here spreads to the whole team) → extract (deterministic metadata first, optional AI for summaries and decisions) → attach provenance → register as CANDIDATE → run dedupe against existing memories by module and title, then flag duplicates instead of merging them.

Commands: `ctxpack capture --from-git`, `ctxpack memory capture`, `ctxpack memory register`.

## Storage sketch (PostgreSQL, adapt to the existing schema)

- `memories` — id, project_id, module, type, title, body, lifecycle, freshness, supersedes_id, canonical_ref, provenance (jsonb), created_by, created_at, updated_at, last_verified_at
- `memory_links` — memory_id, kind (file/module/commit/pr/dependency), ref
- `memory_transitions` — memory_id, from_state, to_state, actor, role, reason, at (append-only audit)

Search without a vector DB: PostgreSQL full-text search (`tsvector`, GIN index) plus filters on project, module, type and lifecycle. `pg_trgm` or `unaccent` are acceptable extensions if search requirements need typo tolerance or accent-insensitivity (for example, Vietnamese); ask first, because they are infrastructure changes.

Default reads return non-DEPRECATED memories, newest first, with a small limit. History is available through an explicit flag.
