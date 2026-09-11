# Domain Model

The eight concepts are separate types with separate storage. Fields below are the minimum; extend them only when a requirement needs it.

## Concepts

| Concept | Answers | Stored in | Key fields |
|---|---|---|---|
| Skill | How does an agent do this kind of work? | Git | id, version, title, appliesTo, requires, conflicts, priority, checksum |
| Context | What is true now? | Git | id, scope, scopeRef, module, tags, status (active/deprecated), statements, sourceMemoryIds, checksum |
| Memory | What was learned, when, from what evidence? | PostgreSQL | id, type, lifecycle, freshness, title, body, provenance, links |
| Hook | What runs automatically on an event? | Git | id, event (pre-commit and others), script, config |
| Policy | What is allowed or denied? | Git | id, scope, rules, enforcement (block/warn) |
| Registry | Which governed artifacts exist, at which version and checksum? | Git (manifest) | artifacts[], version, checksums |
| MCP | Runtime interface to shared knowledge | Server | tool contracts (see `mcp.md`) |
| CLI | Developer/admin control | npm package | commands (see `cli.md`) |

## Scopes

`GLOBAL → TEAM → PROFILE → PROJECT → PERSONAL → SESSION`. Narrower scopes refine broader ones. Merge rules are in `context.md`.

## Memory types

`feature`, `decision`, `observation`, `known_issue`, `gotcha`, `change`. A decision must capture *why* (reason, alternatives, tradeoffs), not only *what*.

## Memory lifecycle and freshness

- `lifecycle`: `OBSERVED | CANDIDATE | VERIFIED | CANONICAL | DEPRECATED`
- `freshness`: `FRESH | POTENTIALLY_STALE`. This is orthogonal to lifecycle: a CANONICAL memory can become potentially stale when its linked code changes.

Keeping these as two fields stops staleness from being mistaken for a lifecycle step.

## ProjectModel

See `templates/project-model.ts`. It is produced deterministically by the Detector from manifests such as `pom.xml`, `build.gradle`, `package.json`, `tsconfig.json`, `nest-cli.json`, `next.config.*`, `pyproject.toml`, `go.mod`, `Dockerfile`, `docker-compose.*` and `Chart.yaml`. Output arrays are sorted so the same repository always yields the same JSON.

## Roles

`LEAD`, `MEMBER`. The permission matrix is in `governance.md`.

## Error codes

Every error carries `code`, `message` (what happened), `cause` (why) and `fix` (how to resolve it).

| Code | Typical cause | Typical fix |
|---|---|---|
| PROJECT_NOT_FOUND | Repo not registered or detection failed | `ctxpack init` / `ctxpack detect` |
| REGISTRY_NOT_FOUND | Registry URL/config missing | `ctxpack setup` or fix config |
| MCP_UNAVAILABLE | Server unreachable | Check URL/network; `ctxpack doctor` |
| UNAUTHORIZED | Missing/expired credentials | Re-authenticate |
| FORBIDDEN | Role lacks permission | Ask a LEAD |
| MEMORY_NOT_FOUND / CONTEXT_NOT_FOUND / SKILL_NOT_FOUND | Unknown ID or wrong scope | Search first; check scope |
| INTEGRITY_MISMATCH | Artifact content differs from manifest checksum | `ctxpack sync`, or review local edits |
| STALE_MEMORY | Operation requires fresh memory but linked code changed | Re-verify the memory |
| INVALID_CONFIGURATION | Config fails schema validation | Fix the reported field |
