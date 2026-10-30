# Neon Signal

**Neon Signal** is a browser-based multiplayer code-and-bluff game. Players lock a secret three-digit code, exchange a clue, challenge another player's clue, and try to crack opponents' codes across five rounds.

Current source version: **0.1.0** (submission release candidate). It includes the current peer-to-peer multiplayer implementation, a maximum of eight active players per room, a spectator mode, Cloudflare TURN configuration, structured/verifiable clues, a beginner tutorial, and automated logic tests.

## Start here

### Requirements

- Node.js 20 or newer (Node.js 22 LTS is recommended).
- npm (included with Node.js).
- A modern browser with WebRTC support.

### Install and run locally

```bash
npm ci
npm run dev
```

Vite normally opens the local site at `http://localhost:5173`.

### Run checks before committing

```bash
npm run test:run
npm run build
```

Or run both checks in one command:

```bash
npm run check
```

The production build is written to `dist/`.

## Game at a glance

- **Players:** 2–8 active players per room.
- **Spectators:** Can watch without taking one of the eight player places.
- **Rounds:** Five rounds; Round 3 is double points and Round 5 is the final round.
- **Phases:** Lock, Peek, Bluff, Challenge, Guess, and Reveal.
- **Goal:** Finish Round 5 with the highest total score.
- **Storage:** No traditional database is used in this release. Room state is held by the host browser and is temporary.

## Game fairness and scoring

Bluff clues use structured statements that the host can verify against the secret code. Supported statements are:

- First digit is a selected digit (1–9).
- Middle digit is a selected digit (1–9).
- Last digit is a selected digit (1–9).
- Code contains a selected digit (1–9).
- Sum of all three digits is a selected total (3–27).

A player may tell the truth, submit a false statement, or submit no clue. A successful challenge catches a false or missing clue. See [the complete rules](docs/GAME-RULES.md) for scoring details.

## How the multiplayer connection works

The frontend is a React + TypeScript + Vite application. Sparrow RTC coordinates peer-to-peer WebRTC connections. The host player's browser coordinates game events and round scoring. Cloudflare Pages serves the site and Pages Functions; `/api/turn` creates temporary ICE server credentials so WebRTC can use Cloudflare TURN when a direct peer connection is not possible.

There is no database or persistent room server in this release. If the host closes the page or loses the room session, the room may no longer be available. The host-authoritative peer-to-peer design is suitable for the current project scope, but it is not a tamper-proof competitive-game architecture. A future server-authoritative upgrade is needed for stronger anti-cheat guarantees, persistent accounts, currency, missions, and elimination/spectator progression.

See [the architecture notes](docs/ARCHITECTURE.md).

## Environment variables

The production game needs TURN credentials to help players connect across restrictive networks. Set these in **Cloudflare Pages → Settings → Variables and Secrets → Production**:

| Name | Type | Value |
| --- | --- | --- |
| `DEFAULT_TURN_PROVIDER` | Plain text variable | `cloudflare` |
| `CLOUDFLARE_TURN_KEY_ID` | Encrypted secret | Your Cloudflare TURN Key ID |
| `CLOUDFLARE_TURN_API_TOKEN` | Encrypted secret | Your Cloudflare TURN API token |

The optional Metered provider variables are documented in `.env.example`. Never commit real credentials. For local development, make a private copy of `.env.example` named `.env.local` and fill it with your own credentials only if you need to test TURN locally. `.env.local` and `.dev.vars` are ignored by Git.

Cloudflare Pages also serves basic security headers from `public/_headers`. The `/api/turn` endpoint returns short-lived ICE server credentials to connected browsers. Do not paste its full response into public issues, screenshots, or chat messages; it contains temporary connection credentials.

## Deploy on Cloudflare Pages

Recommended Pages settings:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** the repository root (the folder containing `package.json`)

Keep the `functions/` directory at the repository root so Cloudflare Pages can deploy the Pages Functions alongside the static site. Configure the three production variables above in the Cloudflare dashboard, not in source files. A new production deployment is required after changing environment variables.

## Quality checks and submission evidence

- [Automated and manual QA checklist](docs/QUALITY-ASSURANCE.md)
- [Security and privacy notes](docs/SECURITY.md)
- [Architecture notes](docs/ARCHITECTURE.md)
- [Game rules](docs/GAME-RULES.md)
- [Suggested demonstration script](docs/DEMO-SCRIPT.md)
- [GitHub commit and deployment steps](docs/GITHUB-COMMIT.md)

A GitHub Actions workflow runs the unit tests and production build on pushes and pull requests. Automated tests do not replace testing real devices and networks; complete the multiplayer, spectator, mobile, and keyboard checks in the QA checklist and record the actual results before claiming they passed.

## Current scope and future work

This release intentionally does **not** include accounts, a database, coins, unlockable levels, missions, elimination of defeated players, or persistent spectator progression. Those features should be designed as a separate upgrade using a trusted server-side game state and storage layer.
