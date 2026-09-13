# Changelog

## Unreleased

- **Changed:** the Context Gate opens through the agent's interactive question tool (`AskUserQuestion` in Claude Code) instead of a question list typed into chat. Each checklist item becomes one question with 2-4 selectable options, the recommended option first and labelled `(Recommended)`, HIGH_RISK questions prefixed `[HIGH_RISK]`; at most 4 questions per call, the rest in a second call right after. Follow-ups (`1.1`, `3.1`) use the same tool. The gate no longer ends with a typed-reply instruction ("reply 1b 2c"). The text format stays as a fallback for agents without such a tool. `SKILL.md`, `workflows/context-gate.md`, `workflows/implement-feature.md` and the `CLAUDE.md` managed block all say so.

- **Changed:** the Context Gate follows up per question item instead of closing after one round. When the answers arrive, each numbered item is settled or open (no answer, "Other" without a value, deferred content such as "I'll list the fields", a new sub-decision, a contradiction). Open items get follow-up questions numbered under their parent (`1.1`, `3.1`) and the agent stays read-only; settled items are never re-asked. The agent no longer fills an open item with the recommended default unless the user says so. Once every item is settled it implements in the same turn with no summary to approve. A HIGH_RISK item is settled only by an explicit choice. `SKILL.md`, `workflows/context-gate.md` and the `CLAUDE.md` managed block all say so.

- **Changed:** the Context Gate always opens for a new project, scaffold or empty repository, and for any new feature, screen, page, module, API, CRUD or management screen, form, detail view, dashboard, report or import/export. Such a request is never classified CLEAR, even when it is short or canonical context already fixes the stack. A bug fix with a clear reproduction, a typo or a no-behavior rename still skips the questions.
- **Added:** mandatory question checklists in `workflows/context-gate.md`. For a feature or CRUD module the checklist covers data scope, authentication and roles, delete behavior, fields and sensitive data, and list behavior. A new project also covers stack and layout, and environment. An item is skipped only when the user, canonical context or VERIFIED/CANONICAL memory answers it explicitly, and the gate message names that source. Authentication and delete behavior are always asked unless the user answered them in the conversation.
- `SKILL.md` and `workflows/implement-feature.md` state the same rule.
- **Changed:** the bundled skill text is compressed for token use without changing any rule, table, command, error code, threshold or file path. The always-loaded `SKILL.md` description drops from 1240 to 774 characters, `SKILL.md` by 19%, `workflows/context-gate.md` by 16%, all skill docs by about 11%. Hook scripts and templates are unchanged.

## 0.3.1

- **Fixed:** the bundled skill is discoverable again. 0.3.0 installed the asset map as `SKILL.md`, so the entry point had no front matter and the agent fell back to the first heading (`Context Pack Registry — Asset Map`) as the description. The skill carried no usable trigger and never activated.
- The entry point description now states the mandatory Context Gate and the requests that trigger it (new project, empty repo, feature, screen, module, API, CRUD or management screen, form, dashboard, import/export), and no longer limits the skill to changes in the Context Pack Registry codebase itself.
- `npm run build` now validates every bundled skill: front matter present and parseable, `name` matching the directory, a description of at least 200 characters, no `": "` sequence that would break the unquoted YAML scalar, and a reference to `context-gate.md` whenever the skill bundles a gate. This is the regression guard for the 0.3.0 defect.
- **Added:** `apply` writes a ctxpack managed block into the project's root `CLAUDE.md` announcing the gate, for projects targeting `claude`. Claude Code always reads that file, so the gate no longer depends on the agent deciding to load the skill first. Existing `CLAUDE.md` content is preserved.
- **Changed:** the Context Gate is one round of questions, not a pause. Read-only ends when the user's answers arrive: the agent folds them into the requirement model, states its remaining assumptions as decisions, and starts implementing in the same turn. It no longer sends a summary for the user to approve, and no longer asks a second round about anything the first round settled. HIGH_RISK work (auth, RBAC, secrets, data loss, schema migration, contract break, memory lifecycle, integrity) is the single exception and still waits for an explicit go-ahead. `SKILL.md`, `workflows/context-gate.md` and the `CLAUDE.md` managed block all say so.

## 0.3.0

- Renamed the npm package to `@aristha/ctxpack` and the executable to `ctxpack`.
- Renamed managed project metadata to `.agent/ctxpack.json` and `.agent/ctxpack.lock.json`.
- This is a breaking rename from the previous `agentctl` command and package.

## 0.2.0

- **Renamed** Agent Registry to **Context Pack Registry**. The skill id is now `context-pack-registry` (`.agent/skills/context-pack-registry/`, `.claude/skills/context-pack-registry`).
- **Migration:** `ctxpack apply` (or `init`) on a 0.1.0 project installs the new skill, rewrites `.agent/ctxpack.json`, the lockfile and the managed hook, and removes the old managed `agent-registry` files. Modified old files block until `--force`; unmanaged files are never deleted. `status` and `doctor` report a pending rename.
- Secret allowlist marker is now `context-pack-registry:allow-secret`; the legacy `agent-registry:allow-secret` is still accepted.
- Unchanged: the `ctxpack` command, the `@aristha/ctxpack` package, the `.agent/` directory and the `AGENT_*` environment variables.

## 0.1.0

- `init`, `plan`, `apply`, `status`, `doctor`; symlink/copy link modes; git shim, husky and manual hook integration; integrity lockfile.
