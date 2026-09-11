# Workflow: Implement a Resolver or the Detector

Covers project detection, skill resolution and context resolution. Load `references/skills.md` or `references/context.md`, plus `templates/project-model.ts` for detection.

## Principles

- **Deterministic.** Same input gives the same output, byte for byte. Sort every output array. Never depend on filesystem enumeration order, object key order or `Map` insertion order coming from I/O.
- **Pure core.** Resolvers take data in and return data; I/O happens at the edges, so tests need no network or database.
- **Metadata first.** Resolve on indexed metadata and load content only for the winners.
- **Explainable.** Every resolved item carries a `reason` (the matched rule, the requirement source, or the scope that won).
- **AI optional.** Semantic ranking, if present, reorders eligible items only and sits behind a flag; tests run with it off.

## Steps

1. Define input and output types (extend `ProjectModel` only if an R needs it).
2. Write fixture-based tests for the new behavior first: fixture repository or registry → expected JSON.
3. Implement filter → requirements → score → conflicts → output (skills), or filter → order → merge → policy → drop deprecated → budget (context).
4. Add a determinism test: run the resolver twice (and on shuffled input), and assert identical output.
5. For the Detector, add one fixture per manifest type touched, plus a malformed-manifest fixture that produces a clear error instead of a crash.
