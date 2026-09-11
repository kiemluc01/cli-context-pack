# Workflow: Implement an ctxpack Command

Load `references/cli.md`.

1. **Classify** the command as read-only or mutating. Read-only commands must not write anything, including caches in managed directories. Mutating commands go through plan/apply.
2. **Contract.** Flags, positional arguments, `--json` output schema, exit codes, and behavior when the MCP server is unreachable (`MCP_UNAVAILABLE` with a fix message).
3. **Thin command.** Parse arguments, call a core function, render output. Logic lives in `core` so it can be unit-tested without spawning a process.
4. **Cross-platform.** `path.join`/`path.resolve`, no hardcoded `/`, normalize CRLF when reading, no shell-outs that assume bash.
5. **Idempotency.** Compute desired state, diff it against current state, and apply only the diff. Writes are atomic (temp file + rename).
6. **Non-interactive safety.** No prompts when stdin is not a TTY; destructive actions require `--yes`.
7. **Tests.**
   - happy path with human and `--json` output
   - usage error → exit 2 with a helpful message
   - run twice → second run reports no changes and the filesystem is unchanged
   - read-only command → directory snapshot identical before and after
   - server unreachable → `MCP_UNAVAILABLE`, exit code as documented
   - Windows-style paths in inputs, where relevant
8. Implement only the command requested; do not scaffold siblings.
