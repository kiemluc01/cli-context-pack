# Domain Model

Eight concepts, separate types and storage. Fields are minimums; extend only when a requirement needs it.

| Concept | Answers | Stored in | Key fields |
|---|---|---|---|
| Skill | How does an agent do this kind of work? | Git | id, version, title, appliesTo, requires, conflicts, priority, checksum |
| Context | What is true now? | Git | id, scope, scopeRef, module, tags, status (active/deprecated), statements, sourceMemoryIds, checksum |
| Memory | What was learned, when, from what evidence? | PostgreSQL | id, type, lifecycle, freshness, title, body, provenance, links |
| Hook | What runs automatically on an event? | Git | id, event (pre-commit and others), script, config |
| Policy | What is allowed or denied? | Git | id, scope, rules, enforcement (block/warn) |
| Registry | Which governed artifacts exist, at which version and checksum? | Git (manifest) | artifacts[], version, checksums |
| MCP | Runtime interface to shared knowledge | Server | tool contracts (`mcp.md`) |
| CLI | Developer/admin control | npm package | commands (`cli.md`) |

- **Scopes:** `GLOBAL → TEAM → PROFILE → PROJECT → PERSONAL → SESSION`; narrower refines broader; merge rules in `context.md`.
- **Memory types:** `feature`, `decision`, `observation`, `known_issue`, `gotcha`, `change`. A decision captures *why* (reason, alternatives, tradeoffs), not only *what*.
- **Lifecycle and freshness are two fields:** `lifecycle` = `OBSERVED | CANDIDATE | VERIFIED | CANONICAL | DEPRECATED`; `freshness` = `FRESH | POTENTIALLY_STALE`, orthogonal (a CANONICAL memory can become potentially stale when linked code changes), so staleness is never mistaken for a lifecycle step.
- **ProjectModel:** `templates/project-model.ts`. Built deterministically by the Detector from manifests such as `pom.xml`, `build.gradle`, `package.json`, `tsconfig.json`, `nest-cli.json`, `next.config.*`, `pyproject.toml`, `go.mod`, `Dockerfile`, `docker-compose.*`, `Chart.yaml`. Arrays sorted so a repository always yields the same JSON.
- **Roles:** `LEAD`, `MEMBER`; permission matrix in `governance.md`.

## Error codes

Every error carries `code`, `message` (what happened), `cause` (why), `fix` (how to resolve).

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
