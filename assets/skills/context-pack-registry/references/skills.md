# Skills

A skill defines **how** an agent performs a kind of work. Skills live in Git, are versioned and checksummed, and are resolved per project so that only relevant skills activate, even when there are hundreds.

## Skill metadata (indexed; content loaded only after resolution)

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

## Resolution pipeline

```
Registry → ProjectModel → Rule filter → Team/Profile requirements → Scoring → Resolved skills
```

1. **Rule filter:** drop skills whose `appliesTo` does not match the ProjectModel. Pure predicate, no AI.
2. **Requirements:** add skills that the team or profile marks as required; an unmet `requires` entry is an error, not a silent drop.
3. **Scoring:** a deterministic score, for example the number of matched `appliesTo` dimensions weighted by specificity, plus `priority`. Optional AI semantic ranking may reorder *among already-eligible skills* only, and the system must still work with it turned off.
4. **Conflicts:** resolve by score, then by `id` lexicographic order, and report the losing skill.
5. **Output:** an ordered list of `{id, version, reason}`. Load content only for resolved skills.

## Rules

- No duplicate canonical skills: the registry build fails on a duplicate `id` or identical content hashes under different IDs.
- Publishing is a LEAD action (see `governance.md`).
- Changing `appliesTo` changes which projects get a skill, so treat it as a behavior change that needs resolver tests.
