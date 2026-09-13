# Integrity

Governed artifacts (skills, context, policies, hooks, profiles, teams) used at runtime must be exactly what was reviewed in Git.

- **Checksums:** SHA-256 after normalizing to UTF-8 and CRLF → LF, nothing else (no trimming or reformatting, or two different files could hash the same). Multi-file artifacts (e.g. a skill folder) hash the sorted list of `relativePath + "\0" + fileHash`, with `/` separators on every OS.
- **Manifest** (in Git): every artifact with `id`, `version`, `path`, `checksum`; generated deterministically (sorted by id) and itself checksummed.
- **Verification points:** `ctxpack sync`, `ctxpack apply`, `skill_get`, `context_resolve`, server startup. A mismatch raises `INTEGRITY_MISMATCH` with artifact id, expected and actual hash prefixes, and the fix (`ctxpack sync` or review of local edits).
- Never repair a mismatch silently; report it and stop the affected operation.
- Local verification never depends on AI or network availability.
- Log integrity failures as security-relevant events (`mcp.md` observability).
