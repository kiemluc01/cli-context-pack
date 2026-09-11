# ctxpack CLI

Package: `@aristha/ctxpack` (installed with `npm install -g @aristha/ctxpack`). The CLI is the developer and admin control interface. It is not the MCP server and never talks to PostgreSQL directly.

## Properties

| Property | Meaning in practice |
|---|---|
| Cross-platform | Use `path` APIs, no shell-specific syntax, handle CRLF, test on Windows paths |
| Deterministic | Same inputs give the same output and ordering; no timestamps in generated artifacts unless required |
| Testable | Commands are thin wrappers around core functions; filesystem and network injectable |
| Scriptable | `--json` on every read command; stable exit codes; no interactive prompt when stdin is not a TTY |
| Safe | Read-only commands never write; mutations go through `plan`/`apply`; destructive actions need confirmation or `--yes` |
| Idempotent | Running `init`, `scan`, `apply` or `sync` twice produces no further changes and no duplicates |

## Commands

Lifecycle: `setup`, `init`, `scan`, `detect`, `status`, `plan`, `apply`, `sync`, `doctor`, `capture`.
Resource groups: `project`, `skill`, `context`, `memory`, `registry`, `policy`, `mcp`.

Implement commands one at a time, following the roadmap or task. Do not scaffold every command at once.

## plan / apply

`plan` computes the diff between desired and current state and prints it (or writes a plan file). `apply` executes a plan, or computes and executes one after confirmation. Both reuse the same diff function, so they cannot disagree. Managed artifacts are written atomically (write to a temp file, then rename).

## Exit codes (recommended convention, confirm with the existing codebase)

`0` success · `1` operation failed · `2` usage or configuration error · `3` checks failed or drift detected (useful for `plan --exit-code` and `doctor` in CI).

## Configuration precedence

flags > environment variables > project config > user config > defaults. Configuration can select a server URL or a profile, but it can never grant a role.

## Output

Human output is concise, with one line per item. Errors print the code, what happened, why, and the fix. Never print secrets or tokens; redact them as `sk-****`.
