# Shared MCP Server

The MCP server is the runtime knowledge interface for every AI agent on the team. It is shared (one server, one PostgreSQL), independently deployable, and the only component that enforces authorization.

## Client Project Session

The MCP server is independent of the client repository. At the beginning of every
agent session, compute the ProjectModel from the current project, choose one stable
`project_slug` for that repository, and call `project_register` with the configured
MEMBER API key. Then use that same
slug for every `memory_search`, `memory_recent`, and `memory_register` call in the
session. This is what makes context shared across Claude, Copilot, Codex, and later
sessions.

Git remains the source of truth for governed `.agent/` and `.claude/` artifacts;
PostgreSQL behind MCP stores dynamic candidate memory and provenance.

## Tool contract

| Tool | Kind | Min role | Purpose | Notable errors |
|---|---|---|---|---|
| project_get | read | MEMBER | Project record and last ProjectModel | PROJECT_NOT_FOUND |
| project_detect | read | MEMBER | Accept a client-computed ProjectModel or detection inputs; return the normalized model | INVALID_CONFIGURATION |
| project_register | write | MEMBER | Register the client project identity and ProjectModel in PostgreSQL | INVALID_CONFIGURATION |
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

This list is the contract. LEAD governance operations (promote, deprecate, publish) are not in it. If a task needs them, ask where they belong (a new MCP tool or the server admin API used by `ctxpack`) and treat the decision as HIGH_RISK.

## Handler conventions

1. **Validate** input against a schema, and reject unknown fields.
2. **Authenticate and authorize** on the server for every call. Derive role from the server's identity store, never from client-sent claims or local config.
3. **Scope** every query by project, so cross-project reads require an explicit permission.
4. **Token-efficient responses:** default `limit` 10 (max 50), cursor pagination, summaries first. Full bodies only with `detail: true` or for single-item gets. No duplicated fields.
5. **Deterministic ordering:** always specify `ORDER BY` with a unique tiebreaker.
6. **Errors** use the codes in `domain-model.md` with `message`, `cause`, `fix`.
7. **Never return secrets.** Redact any provenance or evidence field that matches secret patterns.
8. **Observability:** log tool name, caller id, role, project, latency, result code. Never log request bodies that may contain code or secrets.

## Contract changes

Renaming a tool, removing a field, changing a default or changing a semantic breaks every connected agent on the team at once. Prefer additive changes. Any breaking change is HIGH_RISK and needs explicit confirmation, a version note and client impact analysis.
