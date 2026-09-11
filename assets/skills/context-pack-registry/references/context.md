# Context

Context is the **current canonical truth** about a project, team or organization. It lives in Git, changes through reviewed PRs, and is served at runtime through `context_get`, `context_search` and `context_resolve`.

## Artifact

One YAML file per context entry, using `templates/context.yaml`. Required fields: `id`, `scope`, `scopeRef`, `status` (`active | deprecated`), `statements`. Optional fields: `module`, `tags`, `appliesTo`, `sourceMemoryIds`, `supersedes`. Each statement is short and declarative ("Prompt cache uses Redis."), not a narrative.

## Inheritance

```
GLOBAL → TEAM → PROFILE → PROJECT → PERSONAL → SESSION
```

Resolution algorithm (deterministic):
1. **Filter first.** Select only entries whose `appliesTo`, `module` and `tags` match the task. Never merge the whole tree and filter afterwards, because that loads everything.
2. **Order** by scope (GLOBAL first), then by `id` for a stable order within a scope.
3. **Merge** by `id`: a narrower scope overrides a broader one when it declares the same `id`.
4. **Policy precedence:** a POLICY may mark a context key as non-overridable at a given scope, and narrower scopes cannot override it. (This is the recommended mechanism for combining context and policy; confirm it before implementing.)
5. **Drop** entries with `status: deprecated` unless history is explicitly requested.
6. **Budget:** return summaries and IDs first; full statements on request or when there are few results.

Same inputs must always produce the same output, including ordering.

## PERSONAL and SESSION

PERSONAL context belongs to one developer; SESSION context lasts one agent session. Neither can grant permissions or override policy, and neither is ever promoted to shared context without going through memory → VERIFIED → LEAD publication.

## Deprecation

When a fact stops being true, set `status: deprecated` (and `supersedes` on the replacement) in a PR. Do not delete the file: history and linked memories must stay traceable.
