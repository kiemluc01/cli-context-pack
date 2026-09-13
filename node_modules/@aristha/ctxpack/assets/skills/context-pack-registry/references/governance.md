# Governance

RBAC matrix:

| Action | MEMBER | LEAD |
|---|---|---|
| Read, search, resolve (skills, context, memory) | ✓ | ✓ |
| Capture; register CANDIDATE memory | ✓ | ✓ |
| Verify memory (CANDIDATE → VERIFIED) | | ✓ |
| Promote memory (VERIFIED → CANONICAL) | | ✓ |
| Deprecate memory | | ✓ |
| Modify canonical context | | ✓ |
| Publish skills | | ✓ |
| Modify policies | | ✓ |
| Publish registry | | ✓ |

Enforced on the server only. Git-side changes to governed artifacts go through branch protection and CODEOWNERS; the registry trusts only protected-branch artifacts whose checksums match the manifest.

**Promotion:** 1) MEMBER registers a CANDIDATE with evidence → 2) LEAD verifies (VERIFIED) → 3) LEAD opens a PR adding or updating a context YAML with `sourceMemoryIds` → 4) after merge, LEAD marks the memory CANONICAL with `canonicalRef = path@commit`.

**Deprecation:** deprecating a memory also deprecates the linked context in a PR; history stays queryable.

**Deletion:** only through an explicit governance policy (e.g. leaked secret, legal request), audited with actor, reason, time. Never a side effect of staleness or deprecation.

**Audit:** every lifecycle transition and governance action writes an append-only record: actor, role, action, target, reason, timestamp.
