# Shared MCP Server

Runtime knowledge interface for every AI agent on the team: shared (one server, one PostgreSQL), independently deployable, and the only component that enforces authorization.

## Client project session

The server is independent of the client repository. At the start of every agent session, compute the ProjectModel, choose one stable `project_slug` for the repository, and call `project_register` with the configured MEMBER API key. Use that slug for every `memory_search`, `memory_recent` and `memory_register` call in the session - this shares context across Claude, Copilot, Codex and later sessions. Git stays the source of truth for governed `.agent/` and `.claude/` artifacts; PostgreSQL behind MCP stores dynamic candidate memory and provenance.

## Tool contract

| Tool | Kind | Min role | Purpose | Notable errors |
|---|---|---|---|---|
| project_get | read | MEMBER | Project record and last ProjectModel | PROJECT_NOT_FOUND |
| project_detect | read | MEMBER | Accept a client-computed ProjectModel or detection inputs; return the normalized model | INVALID_CONFIGURATION |
| project_register | write | MEMBER | Register client project identity and ProjectModel in PostgreSQL | INVALID_CONFIGURATION |
| skill_search | read | MEMBER | Search skill metadata | none |
| skill_get | read | MEMBER | One skill by id@version | SKILL_NOT_FOUND, INTEGRITY_MISMATCH |
| skill_resolve | read | MEMBER | Resolve skills for a ProjectModel and task | PROJECT_NOT_FOUND |
| context_get | read | MEMBER | One context entry | CONTEXT_NOT_FOUND |
| context_search | read | MEMBER | Search context by project, module, tags, text | none |
| context_resolve | read | MEMBER | Merged context for scope chain plus task filter | PROJECT_NOT_FOUND |
| memory_search | read | MEMBER | Filtered, paged memory search | none |
| memory_get | read | MEMBER | One memory with provenance | MEMORY_NOT_FOUND |
| memory_recent | read | MEMBER | Recent memories for project or module | none |
| memory_register | write | MEMBER | Create a CANDIDATE memory | FORBIDDEN, INVALID_CONFIGURATION |
| registry_status | read | MEMBER | Registry version, manifest checksum, sync state | REGISTRY_NOT_FOUND |
| agent_status | read | MEMBER | Server health, caller identity and role | UNAUTHORIZED |

This list is the contract. LEAD governance operations (promote, deprecate, publish) are not in it; if a task needs them, ask where they belong (a new MCP tool or the server admin API used by `ctxpack`) and treat the decision as HIGH_RISK.

## Handler conventions

1. **Validate** input against a schema; reject unknown fields.
2. **Authenticate and authorize** server-side on every call; role from the server's identity store, never client-sent claims or local config.
3. **Scope** every query by project; cross-project reads need explicit permission.
4. **Token-efficient responses:** default `limit` 10 (max 50), cursor pagination, summaries first; full bodies only with `detail: true` or single-item gets; no duplicated fields.
5. **Deterministic ordering:** always `ORDER BY` with a unique tiebreaker.
6. **Errors** use `domain-model.md` codes with `message`, `cause`, `fix`.
7. **Never return secrets;** redact provenance or evidence fields matching secret patterns.
8. **Observability:** log tool name, caller id, role, project, latency, result code; never request bodies that may contain code or secrets.

## Contract changes

Renaming a tool, removing a field, or changing a default or semantic breaks every connected agent at once. Prefer additive changes. Any breaking change is HIGH_RISK: explicit confirmation, a version note, client impact analysis.
