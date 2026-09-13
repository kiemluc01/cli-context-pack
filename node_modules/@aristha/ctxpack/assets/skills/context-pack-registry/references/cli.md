# ctxpack CLI

`@aristha/ctxpack` (`npm install -g @aristha/ctxpack`): the developer and admin control interface. Not the MCP server; never talks to PostgreSQL directly.

| Property | In practice |
|---|---|
| Cross-platform | `path` APIs, no shell-specific syntax, handle CRLF, test Windows paths |
| Deterministic | Same inputs → same output and ordering; no timestamps in generated artifacts unless required |
| Testable | Commands are thin wrappers over core functions; filesystem and network injectable |
| Scriptable | `--json` on every read command; stable exit codes; no interactive prompt when stdin is not a TTY |
| Safe | Read-only commands never write; mutations via `plan`/`apply`; destructive actions need confirmation or `--yes` |
| Idempotent | `init`, `scan`, `apply` or `sync` twice produces no further changes and no duplicates |

**Commands** - lifecycle: `setup`, `init`, `scan`, `detect`, `status`, `plan`, `apply`, `sync`, `doctor`, `capture`. Resource groups: `project`, `skill`, `context`, `memory`, `registry`, `policy`, `mcp`. Implement one at a time per roadmap or task; never scaffold every command at once.

**plan / apply:** `plan` computes and prints (or writes to a plan file) the desired-vs-current diff; `apply` executes a plan, or computes and executes one after confirmation. Both reuse one diff function so they cannot disagree. Managed artifacts are written atomically (temp file, then rename).

**Exit codes** (recommended; confirm with the codebase): `0` success · `1` operation failed · `2` usage or configuration error · `3` checks failed or drift detected (`plan --exit-code`, `doctor` in CI).

**Configuration precedence:** flags > environment variables > project config > user config > defaults. Config can select a server URL or profile, never grant a role.

**Output:** concise, one line per item. Errors print the code, what happened, why, and the fix. Never print secrets or tokens; redact as `sk-****`.
