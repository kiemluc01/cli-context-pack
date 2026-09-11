# Workflow: Release

Releases span three independently versioned deliverables. Release only what changed.

| Deliverable | Channel | Version source |
|---|---|---|
| ctxpack | npm `@aristha/ctxpack` | `packages/cli/package.json` (semver) |
| MCP server | Container image / deployment | `packages/mcp-server` version + migrations |
| Governed artifacts (skills, context, policies, hooks) | Git, registry manifest | Per-artifact semver + manifest version |

## Checklist

1. All quality gates pass in CI (full tests, full coverage, full secret scan). CI is the authoritative gate; pre-commit is only the fast one.
2. **Compatibility.** The CLI works against the currently deployed MCP server version, and vice versa. Document the supported version range.
3. **Migrations** are backward compatible with the previous server version (expand, deploy, then contract). They are ordered, tested against a copy of realistic data, and have a rollback path.
4. **Manifest and checksums** regenerated deterministically; `ctxpack registry` verification passes.
5. **Changelog** lists user-visible changes, contract changes and migrations.
6. **Publish** the CLI with `npm publish --access public` from a clean tree, after `npm pack --dry-run` shows no stray files (no `.env`, no fixtures with credentials).
7. **Deploy** the MCP server independently; smoke-test with `agent_status` and `registry_status`.

## Distributing this skill

The skill lives in the vendor-neutral path `.agent/skills/context-pack-registry/`. Claude Code discovers project skills in `.claude/skills/`, so `ctxpack apply` (or a manual step) should link or copy it there, for example `.claude/skills/context-pack-registry → ../../.agent/skills/context-pack-registry`. Keep `.agent/` as the single source to avoid duplicate canonical skills. Install the hooks as described in `hooks/README.md`.
