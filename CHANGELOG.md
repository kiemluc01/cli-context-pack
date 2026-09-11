# Changelog

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
