# Workflow: Implement Memory Features

Load `references/memory.md` first. Memory changes are HIGH_RISK by default when they touch lifecycle, promotion or deletion.

## Specific steps

1. **Classify** the change as lifecycle, provenance, freshness, capture, search, or storage/schema.
2. **State machine first.** If transitions change, update the transition table and its tests before touching handlers. Forbidden transitions need tests as much as allowed ones.
3. **Authorization.** Map every write to a role in `governance.md`, and test MEMBER being denied for every LEAD-only path.
4. **Audit.** Every transition writes a `memory_transitions` row inside the same transaction as the state change.
5. **Provenance.** Validate required fields at the boundary. AI-generated content must carry `model`, `generatedAt` and `confidence`.
6. **History.** Nothing deletes or rewrites old rows. Corrections create a superseding memory.
7. **Freshness.** Changes to linked files or modules set `POTENTIALLY_STALE`; they never change lifecycle.
8. **Capture.** Redact before persisting or sending to AI, and test with fixtures containing fake secrets in the style `AKIA` + 16 characters.
9. **Search.** PostgreSQL full-text search plus filters; no vector DB. Default excludes DEPRECATED, and history is opt-in.

## Must-have tests

Every allowed transition · every forbidden transition · role denial · audit row written atomically · supersede chain · stale marking on linked-file change · redaction in capture · decision memory rejected without `reason` · search default excludes DEPRECATED.
