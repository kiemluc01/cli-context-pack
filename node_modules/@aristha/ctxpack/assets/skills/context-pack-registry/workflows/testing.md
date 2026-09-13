# Workflow: Run Tests and Measure Coverage

1. **Discover existing tooling (never install a duplicate):** `package.json` scripts, `pyproject.toml`, `pom.xml`/`build.gradle`, `go.mod`, `Cargo.toml`, CI config (`.github/workflows`, `.gitlab-ci.yml`), coverage config. Use what CI uses.

| Stack | Usual test / coverage command |
|---|---|
| TypeScript / JS (Vitest) | `npx vitest run --coverage` (add `--changed` for affected tests) |
| TypeScript / JS (Jest) | `npx jest --coverage --changedSince=origin/main` |
| Python | `pytest --cov=<pkg> --cov-report=xml` then `diff-cover coverage.xml --compare-branch=origin/main` if diff-cover is present |
| Java | JaCoCo via `./gradlew test jacocoTestReport` or `mvn test jacoco:report` |
| Go | `go test ./... -coverprofile=cover.out` |
| Rust | `cargo llvm-cov` or `cargo tarpaulin` if configured |

2. **Coverage on changed code** (global coverage hides untested new code). Get changed lines with `git diff --unified=0 origin/main...HEAD` (or the staged index) and check them against the report: a configured diff-coverage tool (e.g. `diff-cover`), otherwise uncovered lines inside changed ranges of the per-file report. Targets: changed business logic ≥ 90%, critical logic ≥ 95%, security/auth/data-integrity as close to 100% as practical. On a miss, add behavior-level tests for uncovered branches; never assertion-free tests to move the number.

3. **No coverage tooling:** say so in the report, propose the stack's standard tool as a recommended next step, don't add it unless asked, and still reason about which changed branches the tests exercise.

4. **Before reporting:** all tests pass, including existing ones; coverage recorded with tool and scope; skipped or flaky tests named.
