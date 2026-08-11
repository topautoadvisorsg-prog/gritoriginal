# Documentation Authority

The repository uses five document classes. A claim from a lower class never
overrides a higher class unless a reviewed change explicitly promotes it.

| Class | Purpose | Authority |
|---|---|---|
| Current state | [`CURRENT_STATE.md`](CURRENT_STATE.md) | Current repository-level implementation and release summary |
| Release evidence | [`deployment/`](deployment/README.md) | Immutable per-slice validation, deployment, boundary, and rollback records |
| Current component contract | Architecture/component README files with a stated truth date | Current only within the stated evidence cutoff |
| Audit or target plan | `system-audit/`, `backend/plans/`, root `SPEC.md`, and dated registers | Historical finding or proposed outcome; not runtime truth |
| Archive | `_archive/` | Historical context only |

## Required labels

- Audit snapshots state their date and reviewed commit and link back to the
  current-state page.
- Target plans use future-tense completion criteria and never claim deployment.
- Release evidence names the exact application commit, validation run,
  deployment identity, residual boundary, and rollback.
- Test counts and provider/schema observations are evidence-cutoff facts, not
  timeless platform guarantees.

## Change rule

When implementation changes, update the relevant release evidence and current
state in the same gated slice. Do not rewrite immutable historical reports to
make them appear current; label and preserve them.
