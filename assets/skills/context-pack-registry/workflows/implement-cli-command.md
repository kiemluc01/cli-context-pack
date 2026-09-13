# Workflow: Implement a ctxpack Command

Load `references/cli.md`.

1. **Classify** read-only (writes nothing, including caches in managed directories) or mutating (goes through plan/apply).
2. **Contract:** flags, positional arguments, `--json` output schema, exit codes, behavior when the MCP server is unreachable (`MCP_UNAVAILABLE` with a fix message).
3. **Thin command:** parse arguments, call a core function, render output. Logic lives in `core` so it is unit-tested without spawning a process.
4. **Cross-platform:** `path.join`/`path.resolve`, no hardcoded `/`, normalize CRLF when reading, no shell-outs assuming bash.
5. **Idempotency:** compute desired state, diff against current, apply only the diff. Atomic writes (temp file + rename).
6. **Non-interactive safety:** no prompts when stdin is not a TTY; destructive actions require `--yes`.
7. **Tests:** happy path with human and `--json` output · usage error → exit 2 with a helpful message · second run reports no changes and the filesystem is unchanged · read-only command leaves a directory snapshot identical · server unreachable → `MCP_UNAVAILABLE`, documented exit code · Windows-style input paths where relevant.
8. Implement only the requested command; do not scaffold siblings.
