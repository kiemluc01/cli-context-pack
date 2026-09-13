# Context Pack Registry Hooks

Fast local guardrail. CI is the authoritative gate and runs the same checks in full: complete test suite, coverage, full-history secret scan.

```
pre-commit → check-tests → check-secrets → format → lint/typecheck → PASS | BLOCK
```

POSIX `sh` scripts for Linux, macOS and Windows (Git for Windows ships `sh`). **Staged files only**; they install nothing.

## Install (pick one)

| Setup | Command |
|---|---|
| No hook manager | `git config core.hooksPath .agent/skills/context-pack-registry/hooks` |
| Existing `.git/hooks` | Copy `pre-commit` to `.git/hooks/pre-commit`; it finds helpers in `.agent/skills/context-pack-registry/hooks` (override with `AGENT_HOOKS_DIR`) |
| husky / lefthook / pre-commit framework | Call `.agent/skills/context-pack-registry/hooks/pre-commit` from the existing hook, keeping the project's manager |

`ctxpack apply` should install idempotently. Never replace a project's existing hook manager.

## Checks

| Script | Blocks when | Deterministic escape hatch (reviewed in PRs) |
|---|---|---|
| `check-tests` | A staged source file with logic has no matching test (tracked or staged) | `.agent/test-exemptions` (shell globs) |
| `check-secrets` | A likely secret in added lines, or a secret-bearing file (`.env`, `*.pem`, `id_rsa`…) is staged | `context-pack-registry:allow-secret` line marker (legacy `agent-registry:allow-secret` accepted); `.agent/secret-allowlist` globs |
| `format` | Formatter errors, or unformatted files in `check` mode | `AGENT_HOOKS_SKIP=format` (visible in output) |
| lint/typecheck (in `pre-commit`) | Configured linter or typechecker reports errors | `AGENT_HOOKS_SKIP=lint`, `AGENT_SKIP_TYPECHECK=1` |

Test and secret checks cannot be skipped via environment variables; their exceptions live in version-controlled, reviewable files.

## Test conventions recognized

| Language | Accepted tests |
|---|---|
| TS/JS | `name.spec.*` / `name.test.*` anywhere (same dir, `__tests__/`, mirrored `tests/`) |
| Python | `test_name.py`, `name_test.py` |
| Go | `name_test.go` in the same directory |
| Java/Kotlin | `NameTest`, `NameTests`, `NameIT` |
| Rust | inline `#[cfg(test)]` or `tests/name.rs` |
| Ruby, C#, PHP | `name_spec.rb`/`name_test.rb`, `NameTests.cs`, `NameTest.php` |

Generic names (`index`, `main`, `utils`, `config`…) need a test near the source - a same-named test elsewhere proves nothing. Re-export-only files (JS/TS barrels, import-only Python `__init__.py`) are exempt automatically. Built-in exemptions: docs, config, lock files, generated code, `*.d.ts`, static assets, migrations, `.agent/` artifacts. Known limitation: matching is by file name, so identically named files in two modules can satisfy each other; CI coverage on changed code is the backstop.

## Output contract

Every failure prints CHECK, STATUS, FILE, REASON and FIX, then a summary table; a non-zero exit blocks. Secrets are always redacted to a 4-character prefix (`AKIA************`).

## Maintaining

- Stable helper exit codes: `0` pass, `1` fail, `3` nothing to check, `98` not configured.
- Script changes need scenario tests in `test-hooks.sh` (temporary git repo per case, PASS and BLOCK paths) and must pass `shellcheck -s sh`. Run `sh test-hooks.sh`.
- New secret pattern: include a boundary so it doesn't fire inside ordinary words; test both a match and a near-miss.
- Performance budget: a few seconds per typical commit; slower belongs in CI.
