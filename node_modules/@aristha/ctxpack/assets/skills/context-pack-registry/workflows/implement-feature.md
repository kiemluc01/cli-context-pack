# Workflow: Implement a Feature or Fix
For any non-trivial change. Domain workflows (memory, MCP tool, CLI command, resolver) add specifics on top.
1. **Understand.** Restate the request in one line.
2. **Context Gate.** Run `context-gate.md`; ask through the interactive question tool and wait unless CLEAR. A new project, feature, screen, module, API, CRUD or management screen, form, dashboard or import/export is never CLEAR - the gate always opens with its mandatory checklist.
3. **Requirement model.** `R1..Rn` with acceptance criteria and the test that proves each.
4. **MCP context.** Only what the task needs (module architecture, conventions, recent memory, related decisions); metadata first; stop when sufficient.
5. **Change-scope.** The block from `SKILL.md`, naming out-of-scope areas.
6. **Inspect source.** Only files in scope, plus their neighboring tests for conventions.
7. **Plan.** A few lines per R (file changed, test proving it), with stated assumptions.
8. **Write tests first (TDD).** Add or update unit tests for every R before production code, covering the dimensions in `references/testing.md`.
9. **Run tests — expect RED.** Every target case must fail for the right reason before coding.
10. **Implement** the smallest change satisfying every R, following the module's patterns.
11. **Review tests — expect GREEN.** Re-run affected tests, then the suite expected before a commit; all green before moving on.
12. **Coverage** on changed code (`testing.md`).
13. **Security**: `references/security.md` checklist if touching auth, input, data exposure, secrets, logging or dependencies. Always run the secret scan.
14. **Format** changed files with the project formatter.
15. **Lint and typecheck** where configured.
16. **Requirement matrix**: `R | Implemented | Tested | Status`; fix any gap.
17. **Architecture gate**: invariant checks in `references/architecture.md`.
18. **Diff review**: `git diff --stat` matches the change-scope; no stray edits, debug or commented-out code.
19. **Stop** and write the completion report.
A step that cannot run (no MCP, coverage tool or formatter): continue, state it in the report, never mark it passed.
