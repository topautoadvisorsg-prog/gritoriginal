# Sound Assets

**Truth date:** June 21, 2026

All six sound files referenced by `src/shared/lib/sounds.ts` currently exist:

| File | Runtime key | Use |
|---|---|---|
| `click.mp3` | `click` | Selection feedback |
| `impact.mp3` | `impact` | KO/TKO pick feedback |
| `chime.mp3` | `chime` | Submission pick feedback |
| `confirm.mp3` | `confirm` | Decision/lock confirmation |
| `fanfare.mp3` | `fanfare` | Achievement/badge feedback |
| `ambience.mp3` | `ambience` | Background ambience; declared but no dedicated helper is exported |

Howler loads files from `/sounds`. Sounds are cached in memory and respect `gamification-settings.enableSounds` in `localStorage`; absence or invalid settings defaults to enabled.

Asset licensing/provenance is not recorded here and must be verified before commercial release. `ambience.mp3` is about 4.4 MB and should be compressed or removed if it remains unused.
