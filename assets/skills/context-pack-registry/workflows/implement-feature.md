# Workflow: Implement a Feature or Fix

Use this for any non-trivial change. Domain workflows (memory, MCP tool, CLI command, resolver) add their specifics on top.

1. **Understand.** Restate the request in one line.
2. **Context Gate.** Run `context-gate.md`. Ask and wait if the request is not CLEAR.
3. **Requirement model.** Write the compact list `R1..Rn` with acceptance criteria. For each R, note which test will prove it.
4. **MCP context.** Fetch only what the task needs (module architecture, conventions, recent memory, related decisions). Metadata first. Stop when sufficient.
5. **Change-scope.** Write the block from `SKILL.md`. Name the out-of-scope areas explicitly.
6. **Inspect source.** Open only the files the scope names. Read the existing tests next to them, since they show conventions.
7. **Plan.** At most a few lines per R: which file changes, which test proves it. Include stated assumptions.
8. **Implement** the smallest change that satisfies every R, following existing patterns in the module.
9. **Tests.** Add or update tests alongside the code, covering the dimensions in `references/testing.md`.
10. **Run tests**: affected tests first, then the suite the project expects before a commit.
11. **Coverage** on changed code (`testing.md`).
12. **Security**: `references/security.md` checklist if the change touches auth, input, data exposure, secrets, logging or dependencies. Always run the secret scan.
13. **Format** changed files with the project formatter.
14. **Lint and typecheck** where configured.
15. **Requirement matrix**: `R | Implemented | Tested | Status`. Fix any gap.
16. **Architecture gate**: the invariant checks in `references/architecture.md`.
17. **Diff review**: `git diff --stat` matches the change-scope, with no stray edits, debug code or commented-out code.
18. **Stop** and write the completion report.

If a step cannot run (no MCP, no coverage tool, no formatter), continue with the rest and state it in the report. Never mark it as passed.
