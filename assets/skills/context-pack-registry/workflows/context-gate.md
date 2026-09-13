# Workflow: Context Gate

Goal: 95–100% understanding with the fewest questions. A wrong assumption costs an implement-review-rework cycle; a good question costs seconds.

## Procedure

1. **Restate** the request in one line to yourself.
2. **Check what is known** first: conversation, code, canonical context, relevant MCP memory (cheap metadata lookups allowed). Never ask what the repository or MCP can answer.
3. **Always-open check** (below). If it applies, the request is never CLEAR and its type's mandatory checklist applies.
4. **Pick relevant categories** (usually 2 to 4).
5. **List unknowns** that would change the code; drop the rest.
6. **Classify** CLEAR / PARTIALLY_CLEAR / AMBIGUOUS / HIGH_RISK (`SKILL.md`).
7. **Ask or proceed.** Proceeding: record low-impact assumptions in the plan. Asking: open the gate through the interactive question tool (Question format), wait, follow up on every item still open, then go straight into the work.

Categories: functional behavior, input, output, validation, error handling, search, filtering, sorting, pagination, authorization, authentication, persistence, transactions, concurrency, performance, caching, external APIs, side effects, events, notifications, logging, observability, backward compatibility, migration, security, testing, UI/API contract, configuration, environment, deployment.

## When the gate always opens

For a new project, init, scaffold or empty repository, and for any new feature, screen, page, module, API, CRUD list, management screen, form, detail view, dashboard, report or import/export. Never CLEAR, however short, even when canonical context fixes the stack. A bug fix with a clear reproduction, a typo, a comment or a no-behavior rename does not force it open.

For each item of the matching mandatory checklist:

- **Skip only if answered explicitly** - by the user in this conversation, canonical context, or VERIFIED/CANONICAL MCP memory. List it under "Taken from existing context" with its source (e.g. `context/tech-stack.yaml`). A guess from naming, common practice or a similar project is not an answer.
- **Always ask authentication/authorization and delete behavior** unless the user answered them in this conversation. Context may name a mechanism (JWT) but not who may do what or what a delete destroys; both are HIGH_RISK.
- **Ask the rest** with options and a recommended default.

If every item is already answered, still send the gate message listing decisions and sources, then proceed in the same turn (HIGH_RISK still waits).

## Follow up per item, then build

The gate buys understanding, not approval. It stays open per numbered item until that item is settled - a reply arriving does not close it. When answers arrive:

1. **Sort each item.** *Settled*: an offered option chosen (including the recommended one), or free text ("Other") that fixes the decision. *Open*: no answer or a dismissed question, "Other" without a usable value, an option that defers content ("I'll list the fields"), an answer that raises a new sub-decision, or answers that contradict each other.
2. **Any item open** → stay read-only and ask follow-ups for those items only, through the same interactive tool, numbered under their parent (`1.1`, `3.1`), with options and a recommended default. Quote what was answered in the question text so the user sees why it is still open. Never re-ask a settled item.
3. **Repeat** until no item is open; each follow-up round covers every open item.
4. **All settled** → in the same turn: write the requirement model and CHANGE-SCOPE with the answers folded in, list remaining low-impact assumptions as decisions made, start implementing and announce the plan and the first file you create.

No summary to confirm, no "shall I start?". Never fill an open item with the recommended default on your own; do it only when the user says so ("use defaults", "cứ làm đi"), and record those as assumptions. A follow-up stays on its open item; a new topic is asked only when an answer reveals a genuinely new AMBIGUOUS or HIGH_RISK decision.

**HIGH_RISK** (auth, RBAC, secrets, data loss, schema migration, API or MCP contract break, memory lifecycle, integrity): name each dangerous assumption. The item is settled only by an explicit choice - a blanket "use defaults" does not settle it - and no file is touched before that go-ahead.

## Adaptive depth

| Request | Questions |
|---|---|
| Typo, comment, log text | None |
| Clear bug fix with a reproduction | None, or one on expected behavior if the reproduction is ambiguous |
| New project, scaffold, empty repo | Always opens. Checklist **New project or app** |
| New feature, screen, CRUD or management module, form, dashboard, import/export | Always opens. Checklist **New feature, screen or CRUD module** |
| New API endpoint or MCP tool | Always opens. Contract: input, output, errors, authz, pagination |
| Search or filter | Fields, matching, normalization, empty query, pagination/sort interplay |
| Auth, RBAC, secrets | Who can do what, failure behavior, audit. HIGH_RISK |
| Schema or data migration | Existing data, rollback, downtime, backfill. HIGH_RISK |
| Memory lifecycle or governance | Who transitions, preconditions, history behavior. HIGH_RISK |

## Question format

**Every question or confirmation goes through the agent's interactive question tool** - `AskUserQuestion` in Claude Code, or any equivalent that renders selectable options and collects the answer. That covers gate items, follow-ups, HIGH_RISK go-aheads, decisions taken from context or conventions that you want the user to confirm, and any approval the pipeline needs later (editing outside CHANGE-SCOPE, a task drifting out of the product). A chat message never asks the user to type an answer, and a question list typed into chat is not an open gate. Use text only when the agent has no such tool (Text fallback).

Before the first call you may write one informational line: `Taken from existing context: <decision> (<source>), ...`. It states decisions and never asks for a reply. If any of them should be confirmed, ask in the tool - e.g. `Keep the conventions taken from context/?` with `Keep all (Recommended)` / `Change some` - not in the text. Then call the tool:

- **One question per checklist item or unknown**, in checklist order, most important first. `question` is the specific technical question ending in `?`; `header` is a chip of at most 12 characters (`Data scope`, `Auth`, `Delete`, `Fields`, `List`).
- **2-4 concrete options.** `label` 1-5 words; `description` states what the option means and its trade-off. The recommended option comes first with ` (Recommended)` appended to its label, and its description gives the one-line reason. Never add an "Other" option - the tool provides free text.
- **HIGH_RISK:** start the question text with `[HIGH_RISK]` and say in it that the choice is the explicit go-ahead.
- **At most 4 questions per call.** When a checklist has more (a feature has 5 items), make the next call as soon as the first returns - same gate round, still read-only, nothing implemented in between.
- `multiSelect: true` only for non-exclusive choices (e.g. which fields search covers). `preview` only to compare concrete artifacts (layouts, schemas, code), never for simple preferences.
- Write questions and options in the user's language.
- **No typed-reply instruction anywhere** - before, between or after calls. No "reply with 1b 2c", no "trả lời ngắn", no "type 'recommended' to start" - the tool collects the answer.

Be specific - good: "Should `memory_search` use case-insensitive *contains* on title and body, or PostgreSQL full-text search with ranking?" with options `Full-text + GIN (Recommended)` / `ILIKE contains`. Bad: "How should search work?"

### Text fallback (agent has no interactive question tool)

```
Before I implement <task>, a few decisions change the code:

1. <Specific technical question>
   a) <option>  b) <option>  c) <option>
   Recommended: <option>, because <one-line reason>.
2. ...

Taken from existing context: <decision> (<source>), ...
Everything else I'll take from existing conventions (<which ones>).
```

Mark each HIGH_RISK question and say its answer is the explicit go-ahead.

## Question banks

**New feature, screen or CRUD module** - mandatory, in order
1. Data scope: entities in this version, relations (foreign key vs free text), what is left for later?
2. Authentication and roles: no login / one admin role / several roles? Record-level access (e.g. an employee sees only their own record)? How is the first account created? HIGH_RISK.
3. Delete behavior: soft delete (status plus `deleted_at`, hidden by default) / hard delete / archive? Effect on related records? HIGH_RISK.
4. Fields: required vs optional, unique keys, status enums, sensitive fields (salary, ID numbers, contact data) and who may see them, file uploads?
5. List behavior: search fields, filters, sort, server- or client-side pagination? Import/export and dashboard now or later?

**New project or app** - items 1-5 plus
6. Stack and layout: backend and frontend frameworks, database, monorepo layout, package manager?
7. Environment: local run (e.g. docker-compose), deployment target, UI language?

Items 6-7 usually come from canonical context (`tech-stack.yaml`, `architecture.yaml`) and go under "Taken from existing context".

**Search** - fields (name / email / phone / username / all)? Matching (exact / contains / startsWith / case-insensitive contains / full-text / fuzzy)? Vietnamese accents or Unicode normalization (`unaccent`), typo tolerance (`pg_trgm`) - both infrastructure changes? Empty keyword returns all or needs a minimum length? Combined with pagination / sorting / filters, server- or client-side?

**API endpoint or MCP tool** - request fields, required vs optional, limits? Response shape, summary vs detail? Error cases and codes? Minimum role, project scoping? Additive or an existing-contract change?

**CLI command** - read-only or mutating (plan/apply)? Flags, `--json` shape, exit codes? Behavior when the MCP server is unreachable? Idempotent on re-run?

**Memory or capture** - memory types and lifecycle state on creation? Required vs optional provenance fields? AI extraction in scope, or deterministic only? Dedupe: flag, skip or merge?

**Resolver** - inputs (ProjectModel fields, task hints)? Tie-breaking and conflict rules? Deprecated or history items ever included?

**Migration** - existing rows: backfill, default or nullable? Rollback path required? Zero-downtime?

**Hooks** - block or warn? Which exemptions? Staged files only, or the whole repository?

## Anti-patterns

A 20-question questionnaire for a small change · asking what the code answers · open-ended questions without options · typing the gate questions into a chat message when an interactive question tool is available · asking the user to type an answer anywhere ("reply 1b 2c", "trả lời ngắn", "type 'recommended'") · asking in text to confirm decisions taken from context or conventions instead of a tool question · calling a new project, feature, screen or CRUD module CLEAR because it is short or the stack is known · skipping authentication or delete behavior because a default looks obvious · dropping a checklist item without naming its source · implementing before the answer arrives · asking to confirm a summary once every item is settled · re-asking a settled item · filling an open item with a default instead of a follow-up · proceeding on a HIGH_RISK assumption without explicit confirmation.
