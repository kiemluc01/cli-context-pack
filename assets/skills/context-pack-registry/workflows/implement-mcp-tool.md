# Workflow: Implement an MCP Tool

Load `references/mcp.md` and the domain reference for the tool (memory, context or skills).

1. **Contract first.** Write the input schema, output shape, error codes and minimum role. If the tool is new or the contract changes, confirm with the user (Context Gate). Breaking changes are HIGH_RISK.
2. **Change-scope.** Typically: the tool handler, the repository or query, the schema or migration if needed, and tests. Adapters, other tools and unrelated CLI commands are out of scope.
3. **Core logic in `core`, transport in `mcp-server`.** The handler validates, authorizes, calls core or the repository, and maps errors. No business rules in the transport layer.
4. **Authorization** runs server-side before any data access, using the server's identity.
5. **Response budget.** Default limit 10, max 50, cursor pagination, summaries unless `detail: true`, deterministic order.
6. **Redaction** of provenance and evidence fields.
7. **Observability.** Log tool, caller, role, project, latency and result code. No bodies.
8. **Tests.**
   - valid input → expected output (assert fields and ordering)
   - invalid input → validation error with a fix message
   - MEMBER/LEAD permission cases, and unauthenticated → UNAUTHORIZED
   - not found → the correct `*_NOT_FOUND` code
   - pagination: stable across pages, limit enforced
   - redaction: a fixture containing a fake secret is never returned
   - repository queries against real PostgreSQL
9. **Docs.** Update the tool table in `references/mcp.md` if the contract changed.
