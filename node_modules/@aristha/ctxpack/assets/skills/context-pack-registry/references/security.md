# Security

## Security gate (every security-sensitive change)

| Area | Check |
|---|---|
| Authentication | Every server entry point requires identity; token expiry and revocation handled |
| Authorization | Server-side role check before any repository access; MEMBER denial tested for every LEAD action |
| Input validation | Schema validation at the boundary; limits on sizes, counts, string lengths |
| Injection | Parameterized SQL only, no string-built queries; artifact paths normalized and confined to the repository root (reject `..` and absolute paths); no shell interpolation of user input |
| Secret handling | Secrets from environment variables or a secret manager, never committed files |
| Logging | No secrets, tokens, request bodies with code, or full diffs |
| Data exposure | Responses scoped to the caller's project; provenance and evidence redacted |
| Dependency risk | New dependencies justified in the plan; lockfile updated; audit tool run if the project has one |

**Never in code, fixtures, logs, captured memory or output:** API keys, passwords, tokens, private keys, credentials of any kind. Show a detected secret as at most a four-character prefix plus asterisks (`AKIA************`, `sk-************`).

**Capture pipeline:** diffs and PR bodies routinely contain secrets. Redact before persistence and before sending anything to an AI provider; a secret in shared memory reaches the whole team and every agent. Hard-deleting such a memory is a governance action (`governance.md`).

**Pre-commit secret detection** (`hooks/check-secrets`): the project's configured scanner (gitleaks, detect-secrets) first, then built-in fallback patterns. A detection blocks the commit and reports what, where, why it is dangerous, and remediation (remove it, rotate the credential, move it to an environment variable). Any committed credential, even briefly, must be rotated - removing it from history does not un-leak it.

**AI boundary:** AI never decides authorization, secret enforcement or integrity. It may help interpret risk; the deterministic check always blocks.
