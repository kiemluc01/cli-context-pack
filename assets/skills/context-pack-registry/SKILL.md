---
name: context-pack-registry
description: Engineering control pipeline for non-trivial coding work in repos that install this pack. MANDATORY FIRST STEP - run the Context Gate (workflows/context-gate.md) before writing code for a new project, scaffold or empty repo, or any new feature, screen, page, module, API, CRUD list, management screen, form, detail view, dashboard, report or import/export, even a short request naming no stack (e.g. build an employee management web app). The gate always opens as interactive questions (AskUserQuestion when available) - read-only until every question item is settled (follow up on any item still unclear, never re-ask a settled one), then state assumptions and implement in the same turn. Also use for ANY change to the Context Pack Registry codebase (ctxpack CLI, shared MCP server, PostgreSQL memory, governed skills/context/policies/hooks, resolvers, capture, integrity, RBAC, releases), even small ones.
---

# Context Pack Registry

Controlled pipeline for building Context Pack Registry - a shared knowledge and control plane: code changes become shared memory, are verified by people, promoted to canonical context, and reused by any agent (Claude, Copilot, Codex) through one shared MCP server. Load only the files the task needs (Routing).

It is not a skill installer, prompt manager, `.claude` config manager, vector database, chatbot, MCP wrapper or agent marketplace. If a task drifts there, stop and confirm.

## Invariants (touching one = HIGH_RISK; checks in `references/architecture.md`)

1. **Eight separate concepts** - SKILL (how work is done), CONTEXT (current truth), MEMORY (history), HOOK (event guardrail), POLICY (allow/deny), REGISTRY (source of truth for governed artifacts), MCP (runtime interface), CLI (control). No type, table, module or command merges two.
2. **Memory ≠ Context.** `OBSERVED → CANDIDATE → VERIFIED → CANONICAL → DEPRECATED` only via explicit, authorized transitions. Nothing auto-promotes; history is never silently deleted.
3. **Git owns governed artifacts** (skills, canonical context, policies, hooks, profiles, teams, versions, registry config); **PostgreSQL behind MCP owns dynamic knowledge** (memories, decisions, observations, provenance, relationships). No vector DB in the MVP.
4. **CLI ≠ MCP server.** The server deploys independently and is team-shared; memory never lives only on one machine.
5. **RBAC is server-side.** LEAD/MEMBER checked on every call; local config never grants authority.
6. **AI is optional.** Detection, checksums, secret enforcement, authorization, configuration are deterministic; AI only extracts, ranks, compresses, interprets.
7. **Vendor-neutral core.** Agent adapters are out of scope unless requested.

## Pipeline

```
CONTEXT GATE → REQUIREMENT MODEL → MCP CONTEXT → CHANGE-SCOPE → PLAN
→ CODE + TESTS → COVERAGE → SECURITY → FORMAT / LINT / TYPECHECK
→ REQUIREMENT GATE → ARCHITECTURE GATE → STOP
```

Mandatory for non-trivial changes. Trivial ones (typo, comment, log wording, no-behavior single-file rename) skip gate questions but still run relevant tests and the formatter.

### 1. Context Gate (`workflows/context-gate.md`)

| Class | Meaning | Action |
|---|---|---|
| CLEAR | One reasonable implementation | Proceed |
| PARTIALLY_CLEAR | Missing details change the code | Ask targeted questions |
| AMBIGUOUS | Several valid implementations | Ask for a choice |
| HIGH_RISK | Auth, RBAC, secrets, data loss, schema migration, API or MCP contract break, memory lifecycle, integrity | Explicit confirmation of every dangerous assumption |

- **Always opens** for a new project, scaffold or empty repo, and any new feature, screen, page, module, API, CRUD or management screen, form, detail view, dashboard, report or import/export - never CLEAR, even when short or the stack is known. Ask that type's mandatory checklist.
- Skip a checklist item only when the user, canonical context or VERIFIED/CANONICAL memory answers it explicitly, and name that source. Always ask authentication/authorization and delete behavior unless the user answered them in this conversation.
- **Follow up per item, not a checkpoint.** The gate stays open for each numbered item until it is settled. An item the answers leave open (no answer, "Other" without a value, deferred content, a new sub-decision, a contradiction) gets a follow-up for that item only; never re-ask a settled item, never fill an open one with a default unless the user says to. When every item is settled, read-only ends: put decisions and low-impact assumptions in the plan and implement in the same turn, no summary to approve. HIGH_RISK items need an explicit choice before any file change.
- **Every question or confirmation goes through the interactive question tool** (`AskUserQuestion` in Claude Code; typed text only when the agent has no such tool) - gate items, follow-ups, HIGH_RISK go-aheads, confirming decisions taken from context, and any later approval (editing outside CHANGE-SCOPE, a drifting task). Only code-changing questions, concrete options with the recommended one first, most important first, about five for a typical feature - at most 4 per call, the rest in a second call right after. No message ever asks the user to type an answer ("reply 1b 2c", "trả lời ngắn").
- Never silently invent a requirement; low-impact assumptions must be visible in the plan.

### 2. Requirement model

`R1..Rn` covering Goal, Inputs, Outputs, Rules, Edge cases, Errors, Security, Performance, Persistence, External effects, Compatibility, Acceptance criteria. Every R maps to implementation, test, configuration or documentation (unmapped = not done). Decide *what must be tested* before coding.

### 3. MCP context

- Narrow order: project → module → relevant files → canonical context → recent memory → related decisions. Metadata and summaries before content; stop when confident; never fetch an item twice in one task.
- Every session: derive one stable `project_slug` from the repo, register it with `project_register` and the local ProjectModel, and use that slug for all memory reads and candidate writes, so sessions share context without mounting the repo into the MCP server.
- `MCP_UNAVAILABLE`: say so, fall back to Git canonical context plus local source, never guess team knowledge.

### 4. Change-scope (write before editing)

```
CHANGE-SCOPE
Task:          ...
Allowed:       packages / files / schema / tests
Out of scope:  ...
Tests:         files to add or update
Migration:     none | describe
API/MCP change: none | describe (backward compatible?)
Security impact: none | describe
```

Editing outside "Allowed" needs a reason tied to an R, or user approval.

### 5. Implement with tests

Tests are part of the implementation. Any change to logic, business rules, API, database, resolver, MCP or CLI behavior adds or updates tests: happy path, boundaries, invalid/empty/null input, authorization, errors, regressions, domain edge cases. Assert results, state, side effects, errors, permissions; "runs without throwing" is not a test unless that is the behavior. Never delete a test because the implementation changed; replace it with one matching the new explicit requirement. Details: `references/testing.md`.

### 6. Quality gates (every applicable one passes before reporting)

| Gate | Pass condition |
|---|---|
| Unit tests | All pass, including pre-existing |
| Coverage (changed code, not global) | Business logic ≥ 90%, critical logic ≥ 95%, security/auth/data-integrity as close to 100% as practical |
| Security | `references/security.md` checklist; no secrets in code, logs, fixtures or captured memory |
| Format | Project formatter on changed files only |
| Lint / typecheck | Pass where configured |
| Requirement coverage | Matrix `R | Implemented | Tested | Status`, no Implemented = NO, ≥ 95% overall |
| Architecture | Invariants re-checked |

Use the project's existing tooling; never install a new tool when one does the job.

### 7. Stop

Stop when requested Rs are implemented, tested, and every gate passes. No unrequested refactoring, optimization, abstraction, adapters, features, vector search, AI integration or redesign - "while you're here" is not permission. Put worthwhile improvements under "Recommended next step" unless a current R requires one.

## Change-specific rules

- **API / MCP contract:** check request, response, validation, authn, authz, clients, tests, docs, backward compatibility. HIGH_RISK by default.
- **Database:** migration, rollback, existing data, indexes, constraints, transactions, tests. No destructive change without an explicit requirement.
- **Performance:** only with evidence (metrics, profiles, query plans, benchmarks); never speculative caches, queues or vector stores.
- **CLI:** read-only commands never mutate; `plan` previews, `apply` mutates, both idempotent.
- **Errors:** codes from `references/domain-model.md`; each says what happened, why, and how to fix.

## Routing (load the smallest set)

| Task mentions | Load |
|---|---|
| Any non-trivial request (first step) | `workflows/context-gate.md` |
| Generic feature or bug fix | `workflows/implement-feature.md` + domain reference below |
| Memory, capture, provenance, promotion, stale | `references/memory.md`, `workflows/implement-memory.md` |
| MCP tool (`memory_*`, `context_*`, `skill_*`, `project_*`, status) | `references/mcp.md`, `workflows/implement-mcp-tool.md` + the tool's domain reference |
| ctxpack command | `references/cli.md`, `workflows/implement-cli-command.md` |
| Context inheritance or resolution | `references/context.md`, `workflows/implement-resolver.md` |
| Skill registry or resolution | `references/skills.md`, `workflows/implement-resolver.md` |
| Project detection / ProjectModel | `references/domain-model.md`, `workflows/implement-resolver.md`, `templates/project-model.ts` |
| RBAC, publish, promote, deprecate | `references/governance.md`, `references/security.md` |
| Checksums, lockfile, tamper detection | `references/integrity.md` |
| Secrets, auth, logging, injection | `references/security.md` |
| Hooks (pre-commit and others) | `hooks/README.md`, then the hook script |
| Tests, coverage | `workflows/testing.md`; `references/testing.md` for strategy |
| Package layout, dependency direction | `references/architecture.md` |
| Versioning, publishing, deploy | `workflows/release.md` |
| New memory or context artifact | `templates/memory.yaml`, `templates/context.yaml` |

## Completion report

End every implementation with this report and nothing longer:

```
IMPLEMENTATION COMPLETE
Requirement Coverage: XX% (R1..Rn, list any not PASS)
Changed:        - file: what and why
Tests:          - file: behaviors covered
Coverage:       - changed-code % and tool used
Security:       - checks run, findings
Formatting:     - tool, files
Lint/Typecheck: - tool, result
Architecture:   PASS | FAIL (which invariant)
Out of Scope:   - noticed but not done
Known Limitations: - ...
Recommended Next Step: - ...
```

A gate that could not run (e.g. no coverage tool) is stated explicitly, never reported as passed.
