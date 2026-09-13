# Workflow: Implement a Resolver or the Detector

Project detection, skill resolution, context resolution. Load `references/skills.md` or `references/context.md`, plus `templates/project-model.ts` for detection.

Principles:
- **Deterministic:** same input, byte-identical output. Sort every output array; never depend on filesystem enumeration order, object key order or I/O-derived `Map` insertion order.
- **Pure core:** data in, data out; I/O at the edges, so tests need no network or database.
- **Metadata first:** resolve on indexed metadata; load content only for winners.
- **Explainable:** every resolved item carries a `reason` (matched rule, requirement source, or winning scope).
- **AI optional:** semantic ranking only reorders eligible items, behind a flag; tests run with it off.

Steps:
1. Define input and output types (extend `ProjectModel` only if an R needs it).
2. Write fixture-based tests first: fixture repository or registry → expected JSON.
3. Implement filter → requirements → score → conflicts → output (skills), or filter → order → merge → policy → drop deprecated → budget (context).
4. Determinism test: run twice, and on shuffled input; assert identical output.
5. Detector: one fixture per touched manifest type, plus a malformed-manifest fixture that yields a clear error, not a crash.
