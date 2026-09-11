# Workflow: Run Tests and Measure Coverage

## 1. Discover existing tooling (never install a duplicate)

Look at `package.json` scripts, `pyproject.toml`, `pom.xml`/`build.gradle`, `go.mod`, `Cargo.toml`, CI config (`.github/workflows`, `.gitlab-ci.yml`), and existing coverage config. Use what CI uses.

| Stack | Usual test / coverage command |
|---|---|
| TypeScript / JS (Vitest) | `npx vitest run --coverage` (add `--changed` for affected tests) |
| TypeScript / JS (Jest) | `npx jest --coverage --changedSince=origin/main` |
| Python | `pytest --cov=<pkg> --cov-report=xml` then `diff-cover coverage.xml --compare-branch=origin/main` if diff-cover is present |
| Java | JaCoCo via `./gradlew test jacocoTestReport` or `mvn test jacoco:report` |
| Go | `go test ./... -coverprofile=cover.out` |
| Rust | `cargo llvm-cov` or `cargo tarpaulin` if configured |

## 2. Measure coverage on changed code

Global coverage hides untested new code. Get the changed lines with `git diff --unified=0 origin/main...HEAD` (or against the staged index), and check them against the coverage report:
- Use a diff-coverage tool if one is configured (for example `diff-cover`).
- Otherwise read the per-file report for the changed files and inspect uncovered lines inside the changed ranges.

Targets: changed business logic ≥ 90%, critical logic ≥ 95%, security/auth/data-integrity as close to 100% as practical. If a target is missed, add behavior-level tests for the uncovered branches. Never add assertion-free tests to move the number.

## 3. If no coverage tooling exists

Say so in the report, propose the standard tool for the stack as a recommended next step, and do not add it unless the user asks. Still reason explicitly about which changed branches the tests exercise.

## 4. Before reporting

All tests pass, including existing ones; coverage is recorded with the tool and scope used; any skipped or flaky test is named.
