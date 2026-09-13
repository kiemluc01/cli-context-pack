# Workflow: Release

Three independently versioned deliverables; release only what changed.

| Deliverable | Channel | Version source |
|---|---|---|
| ctxpack | npm `@aristha/ctxpack` | `packages/cli/package.json` (semver) |
| MCP server | Container image / deployment | `packages/mcp-server` version + migrations |
| Governed artifacts (skills, context, policies, hooks) | Git, registry manifest | Per-artifact semver + manifest version |

1. All quality gates pass in CI (full tests, full coverage, full secret scan). CI is authoritative; pre-commit is only the fast gate.
2. **Compatibility:** the CLI works with the deployed MCP server version and vice versa; document the supported range.
3. **Migrations** backward compatible with the previous server version (expand, deploy, then contract), ordered, tested on a copy of realistic data, with a rollback path.
4. **Manifest and checksums** regenerated deterministically; `ctxpack registry` verification passes.
5. **Changelog** lists user-visible changes, contract changes and migrations.
6. **Publish** the CLI with `npm publish --access public` from a clean tree, after `npm pack --dry-run` shows no stray files (no `.env`, no credential fixtures).
7. **Deploy** the MCP server independently; smoke-test with `agent_status` and `registry_status`.

**Distributing this skill:** vendor-neutral path `.agent/skills/context-pack-registry/`. Claude Code discovers `.claude/skills/`, so `ctxpack apply` (or a manual step) links or copies it there, e.g. `.claude/skills/context-pack-registry → ../../.agent/skills/context-pack-registry`. Keep `.agent/` the single source to avoid duplicate canonical skills. Install hooks per `hooks/README.md`.
