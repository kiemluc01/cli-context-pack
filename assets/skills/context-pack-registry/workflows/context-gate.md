# Workflow: Context Gate

Goal: reach 95–100% understanding of the requested behavior with the fewest possible questions. A wrong assumption costs a full implement-review-rework cycle; one good question costs seconds.

## Procedure

1. **Restate** the request in one line to yourself.
2. **Check what is already known** before asking anything: the conversation, the code, canonical context, and relevant MCP memory. Never ask something the repository or MCP can answer; look it up instead. Cheap metadata lookups are allowed here.
3. **Pick relevant categories** from the list below. Most tasks touch only 2 to 4.
4. **List the unknowns** that would change the code. Drop anything that would not.
5. **Classify**: CLEAR / PARTIALLY_CLEAR / AMBIGUOUS / HIGH_RISK (definitions in `SKILL.md`).
6. **Ask or proceed.** When proceeding, record any low-impact assumptions in the plan. When asking, use the format below, wait for the answer, then go straight into the work - see below.

## One round, then build

The gate buys understanding, not approval. It opens for at most one round of questions and closes as
soon as the answers arrive; from that moment you are no longer read-only.

On receiving the answers, in the same turn:

1. Write the requirement model and the CHANGE-SCOPE block, folding the answers in.
2. State every remaining assumption in one short list, as decisions you have made - not as questions.
3. Start implementing. Announce the plan and the first file you create in the same message.

Do not send a summary for the user to confirm, do not ask "shall I start?", and do not re-ask
anything already answered. If an answer is partial or names something you did not offer, take the
recommended default for the rest, record it as an assumption and keep building. The user corrects a
wrong assumption by reading what you wrote and interrupting; that is cheaper than a second round
trip. A second round of questions is justified only when the answers reveal a genuinely new
AMBIGUOUS or HIGH_RISK decision that the first round could not have known about.

**The one exception is HIGH_RISK** (auth, RBAC, secrets, data loss, schema migration, API or MCP
contract break, memory lifecycle, integrity). There, name each dangerous assumption and wait for an
explicit go-ahead before touching a file. Everything not HIGH_RISK proceeds.

Categories: functional behavior, input, output, validation, error handling, search, filtering, sorting, pagination, authorization, authentication, persistence, transactions, concurrency, performance, caching, external APIs, side effects, events, notifications, logging, observability, backward compatibility, migration, security, testing, UI/API contract, configuration, environment, deployment.

## Adaptive depth

| Request | Questions |
|---|---|
| Typo, comment, log text | None |
| Clear bug fix with a reproduction | None, or one about expected behavior if the reproduction is ambiguous |
| New API endpoint or MCP tool | Contract: input, output, errors, authz, pagination |
| Search or filter | Semantics: fields, matching, normalization, empty query, pagination/sort interplay |
| Auth, RBAC, secrets | Security: who can do what, failure behavior, audit. HIGH_RISK |
| Schema or data migration | Compatibility: existing data, rollback, downtime, backfill. HIGH_RISK |
| Memory lifecycle or governance | Who transitions, preconditions, history behavior. HIGH_RISK |

## Question format

```
Before I implement <task>, a few decisions change the code:

1. <Specific technical question>
   a) <option>  b) <option>  c) <option>
   Recommended: <option>, because <one-line reason>.
2. ...

Everything else I'll take from existing conventions (<which ones>).
```

Good: "Should `memory_search` match case-insensitive *contains* on title and body, or PostgreSQL full-text search with ranking? Recommended: full-text with a GIN index, because it scales and needs no new infrastructure."
Bad: "How should search work?"

## Question banks

**Search**
- Which fields: name / email / phone / username / all?
- Matching: exact / contains / startsWith / case-insensitive contains / full-text / fuzzy?
- Normalization: Vietnamese accents or Unicode normalization (`unaccent`)? Typo tolerance (`pg_trgm`)? Both are infrastructure changes.
- Empty keyword: return all, or require a minimum number of characters?
- Combined with pagination / sorting / filters? Server-side or client-side?

**API endpoint or MCP tool**
- Request fields, required versus optional, limits?
- Response shape, and summary versus detail?
- Error cases and codes?
- Minimum role? Project scoping?
- Is this additive or does it change an existing contract?

**CLI command**
- Read-only or mutating (and therefore plan/apply)?
- Flags, `--json` shape, exit codes?
- Behavior when the MCP server is unreachable?
- Idempotency expectation on re-run?

**Memory or capture**
- Which memory types and which lifecycle state on creation?
- Which provenance fields are required versus optional?
- Is AI extraction in scope, or deterministic only?
- Dedupe behavior: flag, skip or merge?

**Resolver**
- Inputs (ProjectModel fields, task hints)?
- Tie-breaking and conflict rules?
- Should deprecated or history items ever appear?

**Migration**
- Existing rows: backfill, default or nullable?
- Rollback path required?
- Zero-downtime requirement?

**Hooks**
- Block or warn?
- Which exemptions?
- Staged files only, or the whole repository?

## Anti-patterns

- A 20-question questionnaire for a small change.
- Asking what the code already answers.
- Open-ended questions without options.
- Asking, then implementing before the answer arrives.
- Asking for confirmation of a summary after the answers are already in.
- A second round of questions about something the first round settled.
- Proceeding on a HIGH_RISK assumption without explicit confirmation.
