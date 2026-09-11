---
name: context-pack-registry
description: Engineering control system for any non-trivial coding work in a repository that installs this pack. MANDATORY FIRST STEP — run the Context Gate in workflows/context-gate.md before writing any code, whenever the user asks to start a new project, init or scaffold a repo, work in an empty repo, or build any new feature, screen, page, module, API, CRUD list, management screen, form, detail view, dashboard, report, or import/export. This applies to short requests that name no stack, such as build an employee management web app, create a user list with CRUD, or make an inventory project. Gate open means read-only until the user answers one round of questions; then state your assumptions and implement in the same turn, without asking for confirmation of a summary. Also use this skill for ANY change to the Context Pack Registry codebase itself (ctxpack CLI, shared MCP server, PostgreSQL memory, Git-governed skills/context/policies/hooks, resolvers, capture, integrity, RBAC, releases), even when the user does not name it and even when the change looks small.
---

# Context Pack Registry: Implementation Control

You are implementing Context Pack Registry inside a controlled pipeline. This file holds the rules and the routing table. Details live in `references/`, `workflows/`, `templates/` and `hooks/`. Load only the files the current task needs (see Reference Routing); loading everything defeats the purpose of this skill.

## What Context Pack Registry is

A shared engineering knowledge and control plane for AI coding agents. Code changes are captured into shared project memory, verified by people, promoted to canonical context, and reused by any agent (Claude, Copilot, Codex) through one shared MCP server.

It is not a skill installer, prompt manager, `.claude` config manager, vector database, chatbot, MCP wrapper, or agent marketplace. If a task drifts toward one of those, stop and confirm with the user.

## Architecture invariants

These are what make the product trustworthy. Breaking one silently corrupts shared team knowledge, so treat any change that touches them as HIGH_RISK.

1. **Eight separate concepts.** SKILL (how work is done), CONTEXT (current canonical truth), MEMORY (historical knowledge), HOOK (event-triggered guardrail), POLICY (allow/deny), REGISTRY (source of truth for governed artifacts), MCP (runtime knowledge interface), CLI (control interface). No type, table, module or command merges two of them.
2. **Memory ≠ Context.** Memory moves `OBSERVED → CANDIDATE → VERIFIED → CANONICAL → DEPRECATED` only through explicit, authorized transitions. Nothing auto-promotes. History is never silently deleted.
3. **Git owns governed artifacts** (skills, canonical context, policies, hooks, profiles, teams, versions, registry config). **PostgreSQL behind MCP owns dynamic knowledge** (memories, decisions, observations, provenance, relationships). No vector DB in the MVP.
4. **CLI ≠ MCP server.** The MCP server deploys independently and is shared by the team. Dynamic memory never lives only on one developer's machine.
5. **RBAC is server-side.** LEAD and MEMBER permissions are checked by the server on every call. Local config never grants authority.
6. **AI is optional.** Detection, checksums, secret enforcement, authorization and configuration are deterministic code. AI is used only for extraction, ranking, compression and interpretation.
7. **Vendor-neutral core.** Agent-specific behavior lives in adapters, and adapters are out of scope unless requested.

Verification commands for each invariant: `references/architecture.md`.

## The pipeline

```
CONTEXT GATE → REQUIREMENT MODEL → MCP CONTEXT → CHANGE-SCOPE → PLAN
→ CODE + TESTS → COVERAGE → SECURITY → FORMAT / LINT / TYPECHECK
→ REQUIREMENT GATE → ARCHITECTURE GATE → STOP
```

It is mandatory for any non-trivial change. A trivial change (typo, comment, log wording, single-file rename with no behavior change) skips the gate questions but still runs relevant tests and the formatter.

### 1. Context Gate

Before writing code, classify the request:

| Class | Meaning | Action |
|---|---|---|
| CLEAR | One reasonable implementation exists | Proceed |
| PARTIALLY_CLEAR | Missing details would change the code | Ask targeted questions |
| AMBIGUOUS | Several valid implementations exist | Ask for a choice |
| HIGH_RISK | Auth, RBAC, secrets, data loss, schema migration, API or MCP contract break, memory lifecycle, integrity | Get explicit confirmation of every dangerous assumption |

**The gate is one round, not a checkpoint.** Read-only ends the moment the answers arrive. Then write the decisions and any low-impact assumptions into the plan and start implementing in the same turn. Do not send the user a summary to approve, and do not re-ask what they just answered; if an answer turns out to be incomplete, choose the recommended default, record it as an assumption and keep going. The single exception is HIGH_RISK: there, every dangerous assumption needs an explicit go-ahead before any file changes.

Ask only questions whose answers change the code. Give concrete options with a recommended default. Put all questions in one message, most important first, and keep it to about five for a typical feature. The question bank per task type is in `workflows/context-gate.md`.

Never silently invent a requirement. A low-impact assumption is acceptable only if it is written into the plan where the user can see it.

### 2. Requirement model

Build it compactly: Goal, Inputs, Outputs, Rules, Edge cases, Errors, Security, Performance, Persistence, External effects, Compatibility, Acceptance criteria. Number the items `R1..Rn`. Every R maps to at least one of implementation, test, configuration or documentation; an unmapped R means the work is not done. Decide *what must be tested* now, before coding.

### 3. MCP context retrieval

Retrieve narrowly, in this order: current project → current module → relevant files → canonical context → recent memory → related decisions. Request metadata and summaries before full content. Stop when you can implement confidently, and never fetch the same item twice in one task.

For every session, derive one stable `project_slug` from the current repository and
register it with the independent MCP server using `project_register` and the local
ProjectModel. Use that slug for all subsequent memory reads and candidate writes so
separate agent sessions share context without mounting the client repository into
the MCP server.

If the MCP server is unreachable (`MCP_UNAVAILABLE`), say so, fall back to canonical context in Git plus local source, and do not guess at team knowledge.

### 4. Change-scope

Write this block before editing:

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

Editing outside "Allowed" requires either a reason tied to a specific R or the user's approval.

### 5. Implement with tests

Tests are part of the implementation, not a follow-up. Any change to logic, business rules, API, database, resolver, MCP or CLI behavior creates or updates tests. Cover the happy path, boundaries, invalid/empty/null input, authorization, errors, regressions and domain edge cases. Assert on results, state, side effects, errors and permissions; "runs without throwing" is not a test unless that is the behavior. Never delete an existing test just because the implementation changed. Replace it with one that reflects the new explicit requirement. Details: `references/testing.md`.

### 6. Quality gates

Every applicable gate must pass before you report completion.

| Gate | Pass condition |
|---|---|
| Unit tests | All pass, including pre-existing ones |
| Coverage (changed code, not global) | Business logic ≥ 90%, critical logic ≥ 95%, security/auth/data-integrity as close to 100% as practical |
| Security | `references/security.md` checklist; no secrets in code, logs, fixtures or captured memory |
| Format | Project formatter applied to changed files only |
| Lint / typecheck | Pass where configured |
| Requirement coverage | Matrix `R | Implemented | Tested | Status` with no Implemented = NO; ≥ 95% overall |
| Architecture | Invariants above re-checked |

Use the tooling the project already has. Do not install a new tool when an existing one does the job.

### 7. Stop condition

Stop when all requested requirements are implemented and tested and every gate passes. Do not continue into unrequested refactoring, optimization, abstraction, adapters, features, vector search, AI integration or redesign. "While you're here" is not permission. Report worthwhile improvements under "Recommended next step" and leave them unimplemented, unless one is required to satisfy a current R.

## Change-specific rules

- **API / MCP contract change:** check request, response, validation, authn, authz, clients, tests, docs and backward compatibility. HIGH_RISK by default.
- **Database change:** migration, rollback, existing data, indexes, constraints, transactions, tests. No destructive change without an explicit requirement.
- **Performance:** optimize only with evidence (metrics, profiles, query plans, benchmarks). Never add caches, queues or vector stores on speculation.
- **CLI:** read-only commands never mutate. `plan` previews, `apply` mutates, and both are idempotent.
- **Errors:** use the explicit codes in `references/domain-model.md`, and every error says what happened, why, and how to fix it.

## Reference routing

Load the smallest set that covers the task.

| Task mentions | Load |
|---|---|
| Any non-trivial request (first step) | `workflows/context-gate.md` |
| Generic feature or bug fix | `workflows/implement-feature.md` + the domain reference below |
| Memory, capture, provenance, promotion, stale | `references/memory.md`, `workflows/implement-memory.md` |
| MCP tool (`memory_*`, `context_*`, `skill_*`, `project_*`, status) | `references/mcp.md`, `workflows/implement-mcp-tool.md`, plus the tool's domain reference |
| ctxpack command | `references/cli.md`, `workflows/implement-cli-command.md` |
| Context inheritance or resolution | `references/context.md`, `workflows/implement-resolver.md` |
| Skill registry or resolution | `references/skills.md`, `workflows/implement-resolver.md` |
| Project detection / ProjectModel | `references/domain-model.md`, `workflows/implement-resolver.md`, `templates/project-model.ts` |
| RBAC, publish, promote, deprecate | `references/governance.md`, `references/security.md` |
| Checksums, lockfile, tamper detection | `references/integrity.md` |
| Secrets, auth, logging, injection | `references/security.md` |
| Hooks (pre-commit and others) | `hooks/README.md`, then the specific hook script |
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

If a gate could not run (for example, no coverage tool is configured), say so explicitly. Never report it as passed.
