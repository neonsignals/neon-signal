# Neon Signal — graphics and visual identity update

This release refreshes the game's presentation without changing its multiplayer protocol, scoring rules, room creation, or player controls.

## Visual direction

- **Core palette:** midnight navy, electric cyan, vivid magenta, blue-violet, and restrained amber alerts.
- **Style:** cinematic science-fiction command center; glass-like panels; thin illuminated borders; readable high-contrast controls.
- **Typography:** the existing Orbitron display face, Inter body face, and JetBrains Mono data face remain in use.

## New generated artwork

| Asset | Use | Format |
| --- | --- | --- |
| `public/backgrounds/neon-city.webp` | Landing, lobby, join, spectator, and game-shell atmosphere | WebP, 1672 × 941 |
| `public/backgrounds/neon-arena.webp` | Live gameplay stage / command-center backdrop | WebP, 1672 × 941 |

The artwork is compressed WebP for faster delivery than the previous large JPEG backgrounds. Existing legacy images remain in the project as fallbacks/reference files; the refreshed stylesheet points the relevant screens to the new assets.

## Files changed

- `src/client/styles/visual-upgrade.css` — central visual layer loaded after the existing screen styles.
- `src/client/screens/LandingScreen.tsx` — refreshed headline, tagline, and factual game feature chips; all existing actions are preserved.
- `src/App.tsx` — adds a styling hook to the gameplay shell and imports the visual layer. Game logic is not intentionally changed here.
- `public/favicon.svg` and `index.html` — align the browser icon and theme color with the updated brand.

## Preview after deployment

The landing and lobby use a cinematic city/network backdrop. The live stage uses the new command-center arena. Player seating, scoreboards, clues, timers, room creation, joining, spectator mode, and buttons remain live React components—not flattened artwork.

## Notes

Background images are decorative. Core text and controls remain in HTML/CSS so they stay responsive, selectable, accessible, and interactive. The stylesheet includes a narrow-screen layout and honors reduced-motion preferences.
