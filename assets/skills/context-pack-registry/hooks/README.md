# Context Pack Registry Hooks

The fast local guardrail. CI is the authoritative gate and must run the same checks in full: complete test suite, coverage, and a full-history secret scan.

```
pre-commit → check-tests → check-secrets → format → lint/typecheck → PASS | BLOCK
```

POSIX `sh` scripts run on Linux, macOS and Windows (Git for Windows ships `sh`). They operate on **staged files only** and install nothing.

## Install

Pick one:

| Setup | Command |
|---|---|
| No hook manager | `git config core.hooksPath .agent/skills/context-pack-registry/hooks` |
| Existing `.git/hooks` | Copy `pre-commit` to `.git/hooks/pre-commit`; it finds the helpers in `.agent/skills/context-pack-registry/hooks` (override with `AGENT_HOOKS_DIR`) |
| husky / lefthook / pre-commit framework | Call `.agent/skills/context-pack-registry/hooks/pre-commit` from the existing hook, so the project keeps its manager |

`ctxpack apply` should perform the install idempotently. Don't replace a project's existing hook manager.

## Checks

| Script | Blocks when | Deterministic escape hatch (reviewed in PRs) |
|---|---|---|
| `check-tests` | A staged source file with logic has no matching test (tracked or staged) | `.agent/test-exemptions` (shell globs) |
| `check-secrets` | A likely secret appears in added lines, or a secret-bearing file (`.env`, `*.pem`, `id_rsa`…) is staged | `context-pack-registry:allow-secret` marker on the line (legacy `agent-registry:allow-secret` still accepted); `.agent/secret-allowlist` globs |
| `format` | The formatter errors, or files are unformatted in `check` mode | `AGENT_HOOKS_SKIP=format` (visible in output) |
| lint/typecheck (in `pre-commit`) | Configured linter or typechecker reports errors | `AGENT_HOOKS_SKIP=lint`, `AGENT_SKIP_TYPECHECK=1` |

The test and secret checks cannot be skipped through environment variables. Their exceptions live in version-controlled files, so they are visible and reviewable.

## Test conventions recognized

| Language | Accepted tests |
|---|---|
| TS/JS | `name.spec.*` / `name.test.*` anywhere (same dir, `__tests__/`, mirrored `tests/`) |
| Python | `test_name.py`, `name_test.py` |
| Go | `name_test.go` in the same directory |
| Java/Kotlin | `NameTest`, `NameTests`, `NameIT` |
| Rust | inline `#[cfg(test)]` or `tests/name.rs` |
| Ruby, C#, PHP | `name_spec.rb`/`name_test.rb`, `NameTests.cs`, `NameTest.php` |

Generic file names (`index`, `main`, `utils`, `config`…) need a test near the source, because a same-named test elsewhere proves nothing. Re-export-only files (JS/TS barrels, Python `__init__.py` with imports only) are exempt automatically.

Built-in exemptions: docs, config, lock files, generated code, `*.d.ts`, static assets, migrations, `.agent/` artifacts.

Known limitation: matching is by file name, so two modules with identically named files can satisfy each other's check. CI coverage on changed code is the backstop.

## Output contract

Every failure prints CHECK, STATUS, FILE, REASON and FIX, then a summary table. The hook exits non-zero to block. Secrets are always redacted to a 4-character prefix (`AKIA************`).

## Maintaining

- Keep the helper exit codes stable: `0` pass, `1` fail, `3` nothing to check, `98` not configured.
- Any change to these scripts needs scenario tests in `test-hooks.sh` (a temporary git repo per case, PASS and BLOCK paths), and must pass `shellcheck -s sh`. Run `sh test-hooks.sh`.
- Adding a secret pattern: include a boundary so it does not fire inside ordinary words, and add a test for both the match and a near-miss.
- Performance budget: a few seconds on a typical commit. Anything slower belongs in CI.
