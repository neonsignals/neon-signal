# Neon Signal — updated project

This version adds an in-game beginner tutorial and fixes the Round 5 display/speech issue. It also improves spectator end-of-game behavior and enforces the room's 8-player limit.

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
- Clarified the challenge instructions to match the scoring rule currently implemented in the game.
- Added `.dev.vars` to `.gitignore` so local secrets are not accidentally committed.

## Important rule note

In the current scoring implementation, a challenge succeeds when the selected player submitted no clue. If that player submitted any clue, the challenge is unsuccessful. The game does not automatically verify whether a written clue is true or false. The tutorial explains this so players are not misled.
