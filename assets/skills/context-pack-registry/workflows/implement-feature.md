# Workflow: Implement a Feature or Fix
Use this for any non-trivial change. Domain workflows (memory, MCP tool, CLI command, resolver) add their specifics on top.
1. **Understand.** Restate the request in one line.
2. **Context Gate.** Run `context-gate.md`. Ask and wait if the request is not CLEAR.
3. **Requirement model.** Write the compact list `R1..Rn` with acceptance criteria. For each R, note which test will prove it.
4. **MCP context.** Fetch only what the task needs (module architecture, conventions, recent memory, related decisions). Metadata first. Stop when sufficient.
5. **Change-scope.** Write the block from `SKILL.md`. Name the out-of-scope areas explicitly.
6. **Inspect source.** Open only the files the scope names. Read the existing tests next to them, since they show conventions.
7. **Plan.** At most a few lines per R: which file changes, which test proves it. Include stated assumptions.
8. **Write tests first (TDD).** Following the plan, add or update the unit tests for every R before writing any production code, covering the dimensions in `references/testing.md`.
9. **Run tests — expect RED.** Run the newly written tests and confirm that all target cases fail (red) for the right reason. Do not proceed to coding until every case is genuinely failing.
10. **Implement** the smallest change that satisfies every R, following existing patterns in the module.
11. **Review tests — expect GREEN.** Re-run the affected tests first, then the suite the project expects before a commit. All cases must be green before this step passes and you move on to the next work.
12. **Coverage** on changed code (`testing.md`).
13. **Security**: `references/security.md` checklist if the change touches auth, input, data exposure, secrets, logging or dependencies. Always run the secret scan.
14. **Format** changed files with the project formatter.
15. **Lint and typecheck** where configured.
16. **Requirement matrix**: `R | Implemented | Tested | Status`. Fix any gap.
17. **Architecture gate**: the invariant checks in `references/architecture.md`.
18. **Diff review**: `git diff --stat` matches the change-scope, with no stray edits, debug code or commented-out code.
19. **Stop** and write the completion report.
If a step cannot run (no MCP, no coverage tool, no formatter), continue with the rest and state it in the report. Never mark it as passed.
