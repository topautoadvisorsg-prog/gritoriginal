# Notes and User History Plan

**Current state:** per-fight post-result notes exist; journal discovery, truthful autosave, limits, retention, and full lifecycle are missing.

## Decisions required

- Note editing window and whether notes become immutable.
- Draft autosave location and cross-device behavior.
- Retention/deletion/export policy.
- Whether notes are permanently private or later shareable.

## Delivery phases

1. Define typed note/draft schemas, backend length limits, and allowed fight/result states.
2. Correct UI copy or add actual local/server draft autosave.
3. Add authenticated journal API with cursor pagination and event/fighter/date filters.
4. Mount history/journal route and link event/fighter views.
5. Add optimistic concurrency/version to prevent overwritten edits.
6. Add export/deletion and retention cleanup.

## Proof

Create/read/edit at window boundaries; duplicate request; concurrent devices; Unicode/length; unauthorized access; draft recovery; event correction; account export/deletion; pagination/filter correctness.

## Definition of done

Users can reliably create, recover, find, export, and delete notes according to one documented policy; backend enforces privacy and limits; no copy promises nonexistent autosave.

**Complexity:** M. **Production risk:** Low-medium.
