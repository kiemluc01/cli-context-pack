# Architecture

## Canonical picture

```
Git repository (governed artifacts)
  skills/  context/  policies/  hooks/  profiles/  teams/  registry config
        │
        ▼
Context Pack Registry Core (library)
  Detector · Resolver · Context Engine · Skill Engine · Memory · Capture · Integrity
        │
   ┌────┴─────────────┐
   ▼                  ▼
ctxpack (CLI)     Shared MCP Server ── PostgreSQL (dynamic knowledge)
                      │
        ┌─────────────┼─────────────┐
      Claude       Copilot        Codex
```

## Core components

| Component | Responsibility | Must not |
|---|---|---|
| Detector | Deterministically build a `ProjectModel` from repository files | Call AI to detect; guess frameworks from file names alone when a manifest exists |
| Resolver | Choose which skills, context and policies apply to a ProjectModel and task | Load every artifact's content; depend on call order or map iteration order |
| Context Engine | Merge canonical context across scopes (GLOBAL→SESSION) | Treat memory as canonical |
| Skill Engine | Index, validate and version skills from Git | Store skills in PostgreSQL as the source of truth |
| Memory | Lifecycle, provenance and freshness of dynamic knowledge | Auto-promote; hard-delete without a governance policy |
| Capture | Turn git diffs, commits and PRs into candidate memory | Persist unredacted secrets; mark output as verified |
| Integrity | Checksums and manifests for governed artifacts | Use AI; silently repair a mismatch |

## Data ownership

| Data | Owner | Why |
|---|---|---|
| Skills, canonical context, policies, hooks, profiles, teams, versions | Git | Reviewed through PRs, versioned, diffable, reproducible |
| Feature/decision memory, observations, known issues, gotchas, recent changes, PR/commit refs, module relations, lifecycle, provenance | PostgreSQL via MCP | High churn, shared across machines and agents, queried at runtime |

Promotion crosses this boundary on purpose. A VERIFIED memory becomes canonical only when a LEAD writes a context artifact into Git, and the memory then records a reference to it (see `memory.md`).

## Suggested package layout

Follow the existing repository structure if it differs. This layout is a greenfield default, not a mandate.

```
packages/
  core/        Detector, Resolver, Context/Skill Engine, Memory domain, Capture, Integrity
               (pure TypeScript; no DB driver, no HTTP server)
  mcp-server/  MCP transport, RBAC enforcement, PostgreSQL repositories, migrations
  cli/         ctxpack (@aristha/ctxpack): commands, output, config
  adapters/    per-agent integration (out of scope unless requested)
```

Dependency direction is `cli → core`, `mcp-server → core`, `adapters → core`. The core imports neither the CLI nor the server. The CLI never opens a PostgreSQL connection; it reaches dynamic knowledge through the MCP server (or that server's API), because authorization must happen server-side.

## Invariant verification

Run these during the Architecture Gate, adapted to the real paths.

| Invariant | Check |
|---|---|
| Memory ≠ Context | No code path sets `CANONICAL` without a LEAD check and a Git context reference. Run `grep -rn "CANONICAL" packages/` and inspect every writer |
| Git ≠ dynamic memory | Skills, context and policies are never written to PostgreSQL as the source of truth; memories are never written into Git-managed directories |
| CLI ≠ MCP | `grep -rnE "from ['\"](pg|postgres|knex|prisma|drizzle)" packages/cli` returns nothing |
| MCP independently deployable | mcp-server builds and starts without the CLI package installed |
| RBAC server-side | Every mutating MCP handler runs the authorization check before touching a repository; tests cover MEMBER being denied |
| AI optional | Core tests pass with no AI provider configured; detection, checksum, secret scan and authz never import an AI client |
| Deterministic detection | Same fixture repo gives byte-identical ProjectModel JSON across runs |
| No vector DB | No embedding store dependency (pgvector, Pinecone, Qdrant, Chroma and so on) was added |
| No duplicate canonical skills | Skill IDs are unique; the registry build fails on a duplicate ID or duplicate content hash |
| No unrelated refactoring | `git diff --stat` touches only CHANGE-SCOPE "Allowed" paths |
