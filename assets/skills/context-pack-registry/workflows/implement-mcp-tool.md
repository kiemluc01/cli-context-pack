# Workflow: Implement an MCP Tool

Load `references/mcp.md` and the tool's domain reference (memory, context or skills).

1. **Contract first:** input schema, output shape, error codes, minimum role. New tool or changed contract → confirm with the user (Context Gate). Breaking changes are HIGH_RISK.
2. **Change-scope:** typically the handler, repository or query, schema or migration if needed, tests. Adapters, other tools and unrelated CLI commands are out of scope.
3. **Core logic in `core`, transport in `mcp-server`:** the handler validates, authorizes, calls core or the repository, maps errors. No business rules in transport.
4. **Authorization** server-side before any data access, using the server's identity.
5. **Response budget:** default limit 10, max 50, cursor pagination, summaries unless `detail: true`, deterministic order.
6. **Redaction** of provenance and evidence fields.
7. **Observability:** log tool, caller, role, project, latency, result code. No bodies.
8. **Tests:** valid input → expected output (assert fields and ordering) · invalid input → validation error with a fix message · MEMBER/LEAD permission cases, unauthenticated → UNAUTHORIZED · not found → the correct `*_NOT_FOUND` code · pagination stable across pages, limit enforced · a fake-secret fixture is never returned · repository queries against real PostgreSQL.
9. **Docs:** update the tool table in `references/mcp.md` if the contract changed.
