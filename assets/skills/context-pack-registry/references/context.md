# Context

**Current canonical truth** about a project, team or organization. Lives in Git, changes through reviewed PRs, served through `context_get`, `context_search`, `context_resolve`.

**Artifact:** one YAML file per entry from `templates/context.yaml`. Required: `id`, `scope`, `scopeRef`, `status` (`active | deprecated`), `statements`. Optional: `module`, `tags`, `appliesTo`, `sourceMemoryIds`, `supersedes`. Statements are short and declarative ("Prompt cache uses Redis."), not narrative.

## Inheritance `GLOBAL → TEAM → PROFILE → PROJECT → PERSONAL → SESSION`

Deterministic resolution:
1. **Filter first** by `appliesTo`, `module`, `tags` matching the task. Never merge the whole tree and filter afterwards - that loads everything.
2. **Order** by scope (GLOBAL first), then `id` within a scope.
3. **Merge** by `id`: a narrower scope overrides a broader one declaring the same `id`.
4. **Policy precedence:** a POLICY may mark a context key non-overridable at a scope; narrower scopes cannot override it. (Recommended mechanism; confirm before implementing.)
5. **Drop** `status: deprecated` entries unless history is explicitly requested.
6. **Budget:** summaries and IDs first; full statements on request or when results are few.

Same inputs always produce the same output, including ordering.

**PERSONAL and SESSION:** one developer's / one agent session's context. Neither grants permissions or overrides policy, and neither is promoted to shared context except through memory → VERIFIED → LEAD publication.

**Deprecation:** when a fact stops being true, set `status: deprecated` (and `supersedes` on the replacement) in a PR. Never delete the file; history and linked memories must stay traceable.
