# Workflow: Implement Memory Features

Load `references/memory.md` first. HIGH_RISK by default when touching lifecycle, promotion or deletion.

1. **Classify:** lifecycle, provenance, freshness, capture, search, or storage/schema.
2. **State machine first:** changed transitions → update the transition table and its tests before handlers. Forbidden transitions need tests as much as allowed ones.
3. **Authorization:** map every write to a role in `governance.md`; test MEMBER denied on every LEAD-only path.
4. **Audit:** every transition writes a `memory_transitions` row in the same transaction as the state change.
5. **Provenance:** validate required fields at the boundary; AI-generated content carries `model`, `generatedAt`, `confidence`.
6. **History:** never delete or rewrite old rows; corrections create a superseding memory.
7. **Freshness:** linked file or module changes set `POTENTIALLY_STALE`, never lifecycle.
8. **Capture:** redact before persisting or sending to AI; test with fake-secret fixtures like `AKIA` + 16 characters.
9. **Search:** PostgreSQL full-text plus filters, no vector DB; DEPRECATED excluded by default, history opt-in.

Must-have tests: every allowed transition · every forbidden transition · role denial · audit row written atomically · supersede chain · stale marking on linked-file change · capture redaction · decision memory rejected without `reason` · search default excludes DEPRECATED.
