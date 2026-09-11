# Changelog

## 0.3.1

- **Fixed:** the bundled skill is discoverable again. 0.3.0 installed the asset map as `SKILL.md`, so the entry point had no front matter and the agent fell back to the first heading (`Context Pack Registry — Asset Map`) as the description. The skill carried no usable trigger and never activated.
- The entry point description now states the mandatory Context Gate and the requests that trigger it (new project, empty repo, feature, screen, module, API, CRUD or management screen, form, dashboard, import/export), and no longer limits the skill to changes in the Context Pack Registry codebase itself.
- `npm run build` now validates every bundled skill: front matter present and parseable, `name` matching the directory, a description of at least 200 characters, no `": "` sequence that would break the unquoted YAML scalar, and a reference to `context-gate.md` whenever the skill bundles a gate. This is the regression guard for the 0.3.0 defect.
- **Added:** `apply` writes a ctxpack managed block into the project's root `CLAUDE.md` announcing the gate, for projects targeting `claude`. Claude Code always reads that file, so the gate no longer depends on the agent deciding to load the skill first. Existing `CLAUDE.md` content is preserved.
- **Changed:** the Context Gate is one round of questions, not a pause. Read-only ends when the user's answers arrive: the agent folds them into the requirement model, states its remaining assumptions as decisions, and starts implementing in the same turn. It no longer sends a summary for the user to approve, and no longer asks a second round about anything the first round settled. HIGH_RISK work (auth, RBAC, secrets, data loss, schema migration, contract break, memory lifecycle, integrity) is the single exception and still waits for an explicit go-ahead. `SKILL.md`, `workflows/context-gate.md` and the `CLAUDE.md` managed block all say so.

## 0.3.0

- Renamed the npm package to `@aristha/ctxpack` and the executable to `ctxpack`.
- Renamed managed project metadata to `.agent/ctxpack.json` and `.agent/ctxpack.lock.json`.
- This is a breaking rename from the previous `agentctl` command and package.

## 0.2.0

- **Renamed** Agent Registry to **Context Pack Registry**. The skill id is now `context-pack-registry` (`.agent/skills/context-pack-registry/`, `.claude/skills/context-pack-registry`).
- **Migration:** `ctxpack apply` (or `init`) on a 0.1.0 project installs the new skill, rewrites `.agent/ctxpack.json`, the lockfile and the managed hook, and removes the old managed `agent-registry` files. Modified old files block until `--force`; unmanaged files are never deleted. `status` and `doctor` report a pending rename.
- Secret allowlist marker is now `context-pack-registry:allow-secret`; the legacy `agent-registry:allow-secret` is still accepted.
- Unchanged: the `ctxpack` command, the `@aristha/ctxpack` package, the `.agent/` directory and the `AGENT_*` environment variables.

## 0.1.0

- `init`, `plan`, `apply`, `status`, `doctor`; symlink/copy link modes; git shim, husky and manual hook integration; integrity lockfile.
