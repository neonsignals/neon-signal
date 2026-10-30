# Quality Assurance and Submission Checklist

This checklist separates automated code checks from tests that require real browsers, devices, and networks. Do not mark a manual test as passed until it has actually been completed.

## Automated checks

Run from the repository root:

```bash
npm ci
npm run test:run
npm run build
```

`npm run check` runs the test suite and production build in sequence. GitHub Actions runs these checks on pushes and pull requests.

The unit tests cover clue parsing and truth evaluation, challenge and guess scoring, round-three multipliers, reaction allow-listing, private player-token redaction, round-label parsing, branded rejoin-code generation/normalization, and retention of scores for temporarily departed players.

## Live multiplayer matrix

| Test | Setup | Expected result | Result / notes |
| --- | --- | --- | --- |
| Two-player room | 2 devices, different networks | Both players join and complete a round | ☐ Not tested |
| Four-player room | 4 devices or browser profiles | All four appear once; actions sync | ☐ Not tested |
| Eight-player room | 8 devices or browser profiles | All eight join; ninth player is rejected | ☐ Not tested |
| Cross-network connection | Wi-Fi host + mobile-data guest | Guest joins without using the same Wi-Fi | ☐ Not tested |
| Watch a Game | 2 players + 1 spectator | Spectator sees phases and scores; no player slot used | ☐ Not tested |
| Spectator reconnect | Spectator refreshes/rejoins | Watch view receives current public game state | ☐ Not tested |
| Player reconnect | Guest drops and reconnects using `NEON-####` | Host can review and approve the return; the long token is never displayed | ☐ Not tested |
| Cross-device player return | Same player enters the branded code from another browser | Original player identity and accumulated score are restored after host approval | ☐ Not tested |
| Rejoin-code privacy | Inspect roster/state broadcasts and UI | Private token is not shown or broadcast; it is sent directly only after approval | ☐ Not tested |
| Room-code compatibility | Create and join a room with the displayed Sparrow invite code | Existing invite format still connects normally; no alias lookup service is required | ☐ Not tested |
| Host disconnect | Host closes/reloads the page | Confirm and document that the room may end | ☐ Not tested |

## Game-rule matrix

| Test | Expected result | Result / notes |
| --- | --- | --- |
| True clue, no challenge | Clue author gets +2 | ☐ Not tested |
| False clue, no challenge | Clue author gets +2 bluff bonus | ☐ Not tested |
| False clue, correctly challenged | Challenger gets +4; target gets no clue bonus | ☐ Not tested |
| True clue, incorrectly challenged | Challenger loses 3; clue author gets +2 | ☐ Not tested |
| Missing clue, correctly challenged | Challenger gets +4; no clue bonus | ☐ Not tested |
| Round 3 | All point changes are doubled | ☐ Not tested |
| Guess scoring | Correct-position, misplaced, and exact-match points are correct | ☐ Not tested |
| Round 5 | Display says `R5/5`; narrator says “Last round” | ☐ Not tested |
| Final reveal | Winner and final scoreboard are correct | ☐ Not tested |

## Accessibility and device checks

- [ ] Complete the main menu, create-room dialog, join form, and tutorial using only Tab, Shift+Tab, Enter, Space, and Escape.
- [ ] Confirm the keyboard focus indicator is visible on every interactive control.
- [ ] Confirm the tutorial opens as a dialog, traps focus while open, closes on Escape, and returns focus to the How to Play button.
- [ ] Test at narrow mobile width (approximately 360–390 CSS pixels) without horizontal page scrolling.
- [ ] Check controls are comfortably tappable; core buttons should be at least 44 CSS pixels high.
- [ ] Enable reduced-motion in the operating system and confirm the game respects it.
- [ ] Check text remains readable at 200% browser zoom.
- [ ] Test speech/audio on a browser that supports it and confirm the user can mute it.

## Browser checks

- [ ] Chrome or Edge desktop
- [ ] Firefox desktop
- [ ] Safari on iPhone or iPad, if available
- [ ] Chrome on Android, if available

## Deployment checks

- [ ] Cloudflare Pages build command is `npm run build`.
- [ ] Cloudflare Pages output directory is `dist`.
- [ ] `functions/` stays at the repository root.
- [ ] Production environment contains `DEFAULT_TURN_PROVIDER=cloudflare`.
- [ ] `CLOUDFLARE_TURN_KEY_ID` is configured as an encrypted secret.
- [ ] `CLOUDFLARE_TURN_API_TOKEN` is configured as an encrypted secret.
- [ ] `/api/ping` returns a successful response.
- [ ] `/api/turn` returns `provider: cloudflare`, a non-empty `iceServers` array, and no provider failures. Do not share its credential fields.
- [ ] Test an actual player joining from a different network after deployment.

## Demo evidence

Capture evidence only from tests actually completed. Suggested evidence: one room with two or more players, one successful and one unsuccessful challenge, Round 3 doubled scoring, a spectator watching, and the final `R5/5` announcement and result. See [the demo script](DEMO-SCRIPT.md).
