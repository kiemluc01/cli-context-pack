# Security

## Security gate (run for every security-sensitive change)

| Area | Check |
|---|---|
| Authentication | Every server entry point requires identity; token expiry and revocation are handled |
| Authorization | Server-side role check before any repository access; MEMBER denial is tested for every LEAD action |
| Input validation | Schema validation at the boundary; limits on sizes, counts and string lengths |
| Injection | Parameterized SQL only; no string-built queries; artifact paths normalized and confined to the repository root (reject `..` and absolute paths); no shell interpolation of user input |
| Secret handling | Secrets come from environment variables or a secret manager, never from committed files |
| Logging | No secrets, tokens, request bodies with code, or full diffs in logs |
| Data exposure | Responses scoped to the caller's project; provenance and evidence redacted |
| Dependency risk | New dependencies justified in the plan; lockfile updated; audit tool run if the project has one |

## Things that must never appear in code, fixtures, logs, captured memory or output

API keys, passwords, tokens, private keys, credentials of any kind. When displaying a detected secret, show at most a four-character prefix followed by asterisks (`AKIA************`, `sk-************`).

## Capture pipeline

Diffs and PR bodies routinely contain secrets. Redact before persistence and before sending anything to an AI provider. A leaked secret in shared memory reaches the whole team and every agent. Hard deletion of such a memory is a governance action (see `governance.md`).

## Pre-commit secret detection

Implemented in `hooks/check-secrets`. The priority order is: the project's configured scanner (gitleaks, detect-secrets) first, then the built-in fallback patterns. A detection blocks the commit and reports what was found, where, why it is dangerous, and how to remediate (remove it, rotate the credential, move it to an environment variable). Any credential that was committed, even briefly, must be rotated, because removing it from history does not un-leak it.

## AI boundary

AI never decides authorization, secret enforcement or integrity. It may help interpret risk, but the deterministic check is always the one that blocks.
