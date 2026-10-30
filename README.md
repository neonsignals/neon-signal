# Neon Signal — updated project

This version adds an in-game beginner tutorial, makes clue challenges objectively verifiable, fixes the Round 5 display/speech issue, improves spectator end-of-game behavior, and enforces the room's 8-player limit.

## Run the project locally

1. Install Node.js (a current LTS release is recommended).
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run dev` to open the local development version.
5. Run `npm run build` to create the production build in `dist/`.

For local TURN testing only, copy `.env.example` to `.env.local` and fill it with fresh credentials. Do not commit `.env.local` or `.dev.vars`.

## Deploy the update

If Cloudflare Pages is connected to your Git repository, copy these updated project files into your repository, commit and push them. Cloudflare Pages should then build the new version using the repository's configured build command and output directory.

Keep production TURN credentials in Cloudflare Pages → Settings → Variables and Secrets. Do not add secrets to source files, this README, or Git.

## What changed

- Added a **How to Play** button on the home screen. It opens a scrollable beginner guide covering joining, all six phases, Rounds 1–5, scoring, and watching a game.
- Fixed round-label parsing so `R5/5` stays the number 5 on players' and spectators' screens.
- The narrator now announces **“Last round”** at the beginning of Round 5.
- Spectators now see the final standings when the match ends and remain connected if the host starts another game.
- Enforced a maximum of 8 players in a room. Spectators do not use a player slot.
- Replaced free-form clues with structured, easy-to-read clue templates: first digit, middle digit, last digit, contains a digit, and sum of digits.
- The host now verifies every submitted clue against the target player's secret code before resolving challenges. False or missing clues can be caught; a challenge against a true clue is penalized.
- The reveal screen now explains whether a challenge caught a false clue, caught a missing clue, or incorrectly challenged a true clue.
- Updated the tutorial, phase prompts, and voice instructions so they describe the verified challenge rules consistently.
- Added `.dev.vars` to `.gitignore` so local secrets are not accidentally committed.

## Challenge rules

Players choose a clue from supported templates rather than entering arbitrary text. Current clue types are:

- First, middle, or last digit equals a selected digit (1–9).
- The code contains a selected digit (1–9).
- The sum of the three digits equals a selected total (3–27).

The host compares the selected claim with the target player's locked three-digit code. A challenge succeeds when the target submitted no clue or a false clue. A correct challenge awards the challenger +4 points; an incorrect challenge against a true clue costs the challenger 3 points. A submitted clue that is not successfully challenged earns its author +2 points. Round 3 doubles all point changes. Empty clues do not earn the +2 clue bonus.

The host rejects non-empty clue text that does not match a supported template. This keeps clue verification deterministic and avoids guessing the meaning of free-form natural language.

## Security note

Keep `.dev.vars`, `.env.local`, TURN tokens, and other credentials out of Git. Rotate any credentials that were previously committed or shared. Production credentials belong in Cloudflare Pages → Settings → Variables and Secrets.
