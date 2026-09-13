# Architecture

```
Git repository (governed artifacts: skills/ context/ policies/ hooks/ profiles/ teams/ registry config)
        │
Context Pack Registry Core (library)
  Detector · Resolver · Context Engine · Skill Engine · Memory · Capture · Integrity
   ┌────┴─────────────┐
ctxpack (CLI)     Shared MCP Server ── PostgreSQL (dynamic knowledge)
                      │
              Claude · Copilot · Codex
```

## Core components

| Component | Responsibility | Must not |
|---|---|---|
| Detector | Deterministically build a `ProjectModel` from repository files | Call AI to detect; guess frameworks from file names alone when a manifest exists |
| Resolver | Choose skills, context and policies for a ProjectModel and task | Load every artifact's content; depend on call order or map iteration order |
| Context Engine | Merge canonical context across scopes (GLOBAL→SESSION) | Treat memory as canonical |
| Skill Engine | Index, validate and version skills from Git | Store skills in PostgreSQL as the source of truth |
| Memory | Lifecycle, provenance, freshness of dynamic knowledge | Auto-promote; hard-delete without a governance policy |
| Capture | Turn git diffs, commits, PRs into candidate memory | Persist unredacted secrets; mark output as verified |
| Integrity | Checksums and manifests for governed artifacts | Use AI; silently repair a mismatch |

## Data ownership

- **Git** (PR-reviewed, versioned, diffable, reproducible): skills, canonical context, policies, hooks, profiles, teams, versions.
- **PostgreSQL via MCP** (high churn, shared across machines and agents, queried at runtime): feature/decision memory, observations, known issues, gotchas, recent changes, PR/commit refs, module relations, lifecycle, provenance.

Promotion crosses the boundary on purpose: a VERIFIED memory becomes canonical only when a LEAD writes a context artifact into Git, and the memory records a reference to it (`memory.md`).

## Suggested package layout (greenfield default; follow the existing structure if different)

```
packages/
  core/        Detector, Resolver, Context/Skill Engine, Memory domain, Capture, Integrity
               (pure TypeScript; no DB driver, no HTTP server)
  mcp-server/  MCP transport, RBAC enforcement, PostgreSQL repositories, migrations
  cli/         ctxpack (@aristha/ctxpack): commands, output, config
  adapters/    per-agent integration (out of scope unless requested)
```

Dependency direction `cli → core`, `mcp-server → core`, `adapters → core`; core imports neither CLI nor server. The CLI never opens a PostgreSQL connection - it goes through the MCP server (or its API), because authorization must happen server-side.

## Invariant verification (Architecture Gate; adapt paths)

| Invariant | Check |
|---|---|
| Memory ≠ Context | No code path sets `CANONICAL` without a LEAD check and a Git context reference. Run `grep -rn "CANONICAL" packages/` and inspect every writer |
| Git ≠ dynamic memory | Skills, context, policies never written to PostgreSQL as source of truth; memories never written into Git-managed directories |
| CLI ≠ MCP | `grep -rnE "from ['\"](pg|postgres|knex|prisma|drizzle)" packages/cli` returns nothing |
| MCP independently deployable | mcp-server builds and starts without the CLI package installed |
| RBAC server-side | Every mutating MCP handler authorizes before touching a repository; tests cover MEMBER denied |
| AI optional | Core tests pass with no AI provider; detection, checksum, secret scan, authz never import an AI client |
| Deterministic detection | Same fixture repo gives byte-identical ProjectModel JSON across runs |
| No vector DB | No embedding store dependency (pgvector, Pinecone, Qdrant, Chroma…) added |
| No duplicate canonical skills | Unique skill IDs; registry build fails on duplicate ID or duplicate content hash |
| No unrelated refactoring | `git diff --stat` touches only CHANGE-SCOPE "Allowed" paths |
