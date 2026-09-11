# @aristha/ctxpack

Install and maintain the **Context Pack Registry** skill (formerly *Agent Registry*) and its pre-commit quality gate in any project, with one command.

```bash
npm install -g @aristha/ctxpack      # or: npm install -g ./aristha-ctxpack-0.2.0.tgz
cd your-project
ctxpack init
```

Requirements: Node.js ≥ 18.17. Git is optional, but hooks need it. Works on Linux, macOS and Windows.

## What `init` installs

| Path | What | Commit it? |
|---|---|---|
| `.agent/skills/context-pack-registry/` | The skill (vendor-neutral source of truth) | Yes |
| `.claude/skills/context-pack-registry` | Where Claude Code (CLI, VS Code, JetBrains) discovers it: a symlink, or a copy on Windows | Yes |
| `.gitattributes` (managed block) | Forces LF for hook scripts, since CRLF breaks `sh` | Yes |
| `.agent/ctxpack.json` | Desired state (skills, targets, link mode, hooks) | Yes |
| `.agent/ctxpack.lock.json` | Installed version + SHA-256 per file (integrity) | Yes |
| `.mcp.json` | Project-scoped `agent-registry` MCP server (`http://localhost:8000/mcp`) | Yes |
| `.git/hooks/pre-commit` | Shim calling the skill's quality gate | No (local; run `ctxpack apply` per clone) |

## Commands

| Command | Writes? | Purpose |
|---|---|---|
| `ctxpack init` | yes | Create the config (or keep the existing one) and install. Idempotent. Options: `--link-mode auto\|symlink\|copy`, `--skip-hooks`, `--dry-run`, `--force` |
| `ctxpack plan` | no | Show what `apply` would change. `--exit-code` exits 3 on drift (for CI) |
| `ctxpack apply` | yes | Converge the project to the config and the bundled skill version |
| `ctxpack status` | no | Installed vs bundled version, modified files; exit 3 on drift |
| `ctxpack doctor` | no | Check node, git, sh, symlink support, config, integrity and hook setup |

Global options: `--cwd <dir>`, `--json`, `--verbose`. Exit codes: `0` ok · `1` failed or blocked · `2` usage/config error · `3` drift.

## Safety rules

- **Never overwrites your edits silently.** A managed file that differs from both the installed (locked) and the bundled version is reported as `INTEGRITY_MISMATCH` and blocks `apply`. `--force` discards the local change.
- **Never touches what it doesn't own.** An existing unmanaged `pre-commit` hook, a foreign `.claude/skills/context-pack-registry` directory, or another hook manager's config is reported with the exact line to add, and left untouched (even with `--force`).
- **Read-only commands are read-only.** `plan`, `status`, `doctor` and `init --dry-run` write nothing.
- **Atomic writes.** Files are written to a temp file and renamed into place.
- **Upgrades are safe.** Files you never modified are updated automatically; files removed from the skill are deleted only if unmodified.

## Hook integration

| Project uses | ctxpack does |
|---|---|
| Nothing | Installs a managed shim at `.git/hooks/pre-commit` |
| husky (`.husky/`) | Adds a managed block to `.husky/pre-commit` (committed, so shared with the team) |
| lefthook / pre-commit framework / custom `core.hooksPath` | Prints the exact snippet to add; never edits their config |

## Team workflow

1. One person runs `ctxpack init` and commits the files marked "Yes" above.
2. Teammates install the CLI and run `ctxpack apply` after cloning (this installs their local hook).
3. In CI, run `ctxpack status` to fail the build when the installation drifts or was edited.
4. To upgrade: `npm install -g @aristha/ctxpack@latest && ctxpack apply`, then commit the result.

**Windows or mixed teams:** `auto` uses copy mode on Windows (symlinks need Developer Mode, and git may check them out as text files). For a repository shared across operating systems, use `ctxpack init --link-mode copy` so everyone gets the same committed layout.

**Upgrading from 0.1.0 (Agent Registry):** install 0.2.0 and run `ctxpack apply` in each project, then commit. The CLI installs `context-pack-registry`, updates the config, lock and hook, and removes the old `agent-registry` files. Files you modified or added in the old folder are never deleted: modified ones block until you use `--force`, and unmanaged ones are left and reported. `ctxpack status` shows `rename pending` until then. The old secret marker `agent-registry:allow-secret` keeps working.

**Migrating from a manually unzipped skill:** run `ctxpack init`. Files that differ from the bundled version are reported as conflicts; if you never edited them, run `ctxpack init --force`.

## Development

```bash
npm install
npm test            # validate the bundled CLI and print its version
npm pack            # produces aristha-ctxpack-<version>.tgz
npm run pack:local  # writes the installable tarball to releases/
```

The bundled skill lives in `assets/skills/context-pack-registry/`. Its hooks have their own suite: `sh assets/skills/context-pack-registry/hooks/test-hooks.sh`.

`ctxpack init` also adds the local `agent-registry` MCP server to `.mcp.json`, so Claude Code can share project context through the MCP server described by the Context Pack Registry project index. Existing MCP servers are preserved. If the project already has a different `agent-registry` endpoint, the change is reported as a conflict; use `ctxpack apply --force` only after reviewing it.

Publishing a scoped package requires the `aristha` npm org: `npm publish --access public`, or `--access restricted` for a private org.

To install the packed CLI into a project, run `npm install -D @aristha/ctxpack` and then `npx ctxpack init`. The package can also be installed from a Git repository with `npm install -D github:aristha/ctxpack`.

For distribution without npm publish, send `releases/aristha-ctxpack-<version>.tgz` to the target project and install it with `npm install -D /path/to/aristha-ctxpack-<version>.tgz`. npm does not install package ZIP files directly; unzip the archive first or use the generated `.tgz` file.
