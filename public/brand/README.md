# Brand Assets

**Truth date:** June 21, 2026

This folder currently contains no production SVG assets. `BrandAsset` requests `/brand/<name>.svg` and renders a labeled gray placeholder when the file fails to load.

Supported filenames are defined by `src/shared/components/ui/BrandAsset.tsx`:

| Filename | Intended asset |
|---|---|
| `grit-wordmark.svg` | Full GRIT wordmark |
| `grit-icon.svg` | GRIT icon mark |
| `founder-1.svg` through `founder-4.svg` | Founder badges |
| `ninja.svg` | Ninja progression badge |
| `samurai.svg` | Samurai progression badge |
| `master.svg` | Master progression badge |
| `grandmaster.svg` | Grandmaster progression badge |
| `goat.svg` | GOAT progression badge |
| `gold-key.svg` | Gold Key milestone |

Adding a correctly named SVG activates it without code changes. Assets must be original/licensed, optimized, accessible at small sizes, and reviewed against the current gold/red visual system. This folder is unrelated to fighter images; fighters use approved face/headshot or quarter-to-half-body photography.
