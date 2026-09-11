# Integrity

Integrity guarantees that governed artifacts (skills, context, policies, hooks, profiles, teams) used at runtime are exactly what was reviewed in Git.

## Checksums

- Algorithm: SHA-256.
- Normalization before hashing: UTF-8, CRLF → LF. Nothing else; do not trim or reformat, or two different files could hash the same.
- Multi-file artifacts (for example, a skill folder): hash the sorted list of `relativePath + "\0" + fileHash`, using `/` separators on every OS.

## Manifest

The registry manifest (in Git) lists every artifact with `id`, `version`, `path`, `checksum`. It is generated deterministically (sorted by id) and is itself checksummed.

## Verification points

`ctxpack sync`, `ctxpack apply`, `skill_get`, `context_resolve`, and server startup. A mismatch raises `INTEGRITY_MISMATCH` with the artifact id, expected and actual hash prefixes, and the fix (`ctxpack sync` or review of local edits).

## Rules

- Never repair a mismatch silently. Report it and stop the affected operation.
- Integrity never depends on AI or network availability for local verification.
- Log integrity failures as security-relevant events (see `mcp.md` observability).
