# Agentic benchmark suite

This suite uses the same repository task shape for every configuration. It is intentionally local and deterministic: `npm run benchmark:self-test` validates task metadata without sending prompts or consuming API credits.

Configurations:

- `B0`: raw agent
- `B1`: Context Pack
- `B2`: Context Pack plus selected skill
- `B3`: Context Pack plus skill router
- `B4`: full governance: gate, pack, router, guardrails, budget, scope, ladder, validation and stop condition

Record one result per configuration and task in JSONL. Required metrics are `task_success`, `tests_passed`, `regressions`, `input_tokens`, `output_tokens`, `total_tokens`, `tool_calls`, `duration`, `cost`, `files_read`, `files_changed`, `lines_added`, `lines_removed`, `unrelated_changes`, `scope_violations`, `context_violations`, `dependency_violations`, `validation_completed`, and `stop_condition_respected`. Never compare different task sets.