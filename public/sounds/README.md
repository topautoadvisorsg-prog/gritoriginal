# Sound Files Directory

This directory contains sound effect files for the gamification system.

## Required Sound Files

The following sound files should be added:

| Filename | Purpose | Recommended Duration |
|----------|---------|---------------------|
| `click.mp3` | UI interaction feedback | 0.1s |
| `success.mp3` | Pick locked, correct prediction | 0.5s |
| `celebrate.mp3` | Badge earned, streak milestone | 1.0s |
| `error.mp3` | Error or invalid action | 0.3s |
| `levelup.mp3` | Tier upgrade or major achievement | 1.5s |

## Recommended Sources (Free & Royalty-Free)

1. **Freesound.org** - Large library of free sounds
2. **Mixkit.co** - Pre-licensed sound effects
3. **Zapsplat.com** - Free with attribution

## Audio Format Guidelines

- **Format**: MP3 (best browser support) or OGG (smaller size)
- **Bitrate**: 128kbps for small file sizes
- **Sample Rate**: 44.1kHz
- **Channels**: Mono (saves space, suitable for UI sounds)

## Implementation

Sounds are loaded via `src/lib/sounds.ts` using Howler.js.
User preferences for sound are stored in GamificationContext and localStorage.
