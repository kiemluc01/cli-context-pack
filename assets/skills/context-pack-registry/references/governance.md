# Governance

## RBAC matrix

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

Enforcement is on the server only. Git-side changes to governed artifacts are enforced through the repository's branch protection and CODEOWNERS; the registry trusts only artifacts on the protected branch whose checksums match the manifest.

## Promotion flow

1. MEMBER registers a CANDIDATE with evidence.
2. LEAD verifies it (VERIFIED).
3. LEAD opens a PR that adds or updates a context YAML with `sourceMemoryIds`.
4. After merge, LEAD marks the memory CANONICAL with `canonicalRef = path@commit`.

## Deprecation

Deprecating a memory also deprecates the linked context in a PR. History stays queryable.

## Deletion

Only through an explicit governance policy (for example, a leaked secret or legal request). Deletion is audited with actor, reason and time. Nothing is ever deleted as a side effect of staleness or deprecation.

## Audit

Every lifecycle transition and governance action writes an append-only audit record: actor, role, action, target, reason, timestamp.
