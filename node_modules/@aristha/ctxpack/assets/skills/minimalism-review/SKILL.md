---
name: minimalism-review
description: Advisory anti-overengineering review for implementation plans and diffs after the relevant code path is understood. Use when a task asks for minimal change, architecture review, refactoring review, dependency review, or a second pass on unnecessary abstractions. It works with the Context Pack governance pipeline and never replaces correctness, security, validation, authorization, accessibility, observability or explicit requirements.
---

# Minimalism Review

Review the proposed change or diff for the smallest correct implementation. This is advisory unless a repository explicitly configures it as a blocking gate.

## Review order

For every questionable element, identify the evidence and classify it as exactly one primary category:

`delete` · `reuse` · `stdlib` · `native` · `dependency` · `yagni` · `shrink`

Inspect for unnecessary:

- abstractions, wrappers and helper layers
- dependencies and configuration
- duplicated utilities or files
- premature generalization
- indirection that does not protect a real boundary

Use this decision order:

1. Can it be deleted without changing required behavior?
2. Can an existing project utility, native platform feature or standard library replace it?
3. Is an already-installed dependency sufficient?
4. Is the generality required by a stated acceptance criterion?
5. What is the smallest correct form?

## Findings

Separate findings into:

- **correctness**: behavior is wrong or incomplete
- **security**: secrets, authorization, integrity or data-loss risk
- **performance**: measurable resource or latency regression
- **architecture**: violation of a repository boundary or contract
- **overengineering**: extra complexity with no required benefit

Never downgrade a correctness or security finding to `overengineering`. For each finding report category, evidence, impact, recommendation, and whether it is blocking. Preserve required tests, validation, guardrails and observability even when the code could be shorter.

## Output

```text
MODE: lite | full | ultra
REVIEW: advisory | blocking
FINDINGS:
- [category] [delete|reuse|stdlib|native|dependency|yagni|shrink] evidence -> recommendation
KEEP:
- required behavior or control that must remain
STOP WHEN:
- acceptance criteria and required validation pass
```