# Skills

A skill defines **how** an agent does a kind of work. Skills live in Git, are versioned and checksummed, and are resolved per project so only relevant ones activate, even among hundreds.

Metadata (indexed; content loaded only after resolution):

```yaml
id: nestjs-api            # unique across the registry
version: 1.4.0            # semver
title: NestJS API conventions
appliesTo:                # deterministic rules evaluated against ProjectModel
  frameworks: [nestjs]
  languages: [typescript]
requires: []              # skill ids that must also resolve
conflicts: []             # skill ids that cannot co-resolve
priority: 50              # tie-breaker, higher wins
checksum: sha256:...      # see integrity.md
```

Resolution: Registry → ProjectModel → Rule filter → Team/Profile requirements → Scoring → Resolved skills
1. **Rule filter:** drop skills whose `appliesTo` doesn't match the ProjectModel. Pure predicate, no AI.
2. **Requirements:** add team- or profile-required skills; an unmet `requires` entry is an error, not a silent drop.
3. **Scoring:** deterministic (e.g. matched `appliesTo` dimensions weighted by specificity, plus `priority`). Optional AI semantic ranking may reorder *already-eligible skills* only; everything must work with it off.
4. **Conflicts:** by score, then `id` lexicographic order; report the losing skill.
5. **Output:** ordered `{id, version, reason}`; load content only for resolved skills.

Rules: no duplicate canonical skills (registry build fails on a duplicate `id` or identical content hashes under different IDs) · publishing is a LEAD action (`governance.md`) · changing `appliesTo` changes which projects get a skill - a behavior change needing resolver tests.
