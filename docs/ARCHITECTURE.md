# Architecture and Data Flow

## Components

```text
Player browser                         Player browser
  React + TypeScript                     React + TypeScript
        |                                      |
        +---------- WebRTC data channels ------+
                         |
                  Sparrow Signaller
             (connection establishment)
                         |
                 Host player's browser
            (room state + round coordination)
                         |
                  Cloudflare TURN
             (relay when direct paths fail)
                         |
               Cloudflare Pages site
                  + Pages Functions
                  + /api/turn
                  + /api/ping
```

## Frontend

- React renders the landing page, room screens, game phases, tutorial, and spectator view.
- TypeScript defines the player and event shapes.
- `src/shared/clues.ts` builds and verifies supported clue statements.
- `src/shared/gameRules.ts` contains pure score-calculation functions with unit tests.
- `src/network/SparrowAdapter.ts` wraps Sparrow RTC, checks known event types, rejects oversized messages, and routes messages to the host or relevant peer.

## Multiplayer

Sparrow RTC helps establish peer-to-peer WebRTC data connections. The host browser coordinates the room and is the current authority for accepting player actions, checking clues, resolving guesses, and calculating round scores. The host's game state is temporary in-memory state.

This design does not require a conventional database, but it also means:

- The room depends on the host browser remaining open and connected.
- Closing or refreshing the host page can end the room.
- A peer-to-peer host is not a trusted anti-cheat server. A technically sophisticated participant may tamper with their own browser or network messages.
- Player return codes use a host-assigned `NEON-####` alias that maps to the original player ID and private token in host memory. The host keeps that mapping when a player leaves the active roster so a later return restores the same ID and accumulated score. The host releases the private token to a reconnecting peer only after approving the return.
- The current project should not be described as providing server-enforced competitive integrity or permanent player accounts.

Room invite codes remain the full Sparrow invite identifier. Replacing them with eight digits would require a shared room-directory service to resolve a short number to the underlying Sparrow invite; no such directory exists in this database-free build. Keep the full invite format until that service is implemented.

For a future competitive version, move authoritative room state, player identity, score calculation, elimination, and persistence to a trusted server-side service. A database, coins, unlocks, and missions should be added only after that authority layer is designed.

## Connection setup

`functions/api/turn.ts` runs as a Cloudflare Pages Function. It reads provider credentials from the server-side environment and requests fresh Cloudflare TURN ICE server credentials. The browser calls `/api/turn`; the Cloudflare API token itself is never intended to appear in the frontend bundle.

Production variables:

- `DEFAULT_TURN_PROVIDER=cloudflare`
- `CLOUDFLARE_TURN_KEY_ID` (secret value identifier)
- `CLOUDFLARE_TURN_API_TOKEN` (encrypted secret)

`/api/ping` is a lightweight health endpoint. These endpoint checks demonstrate that the web/API layer responds; they do not prove that a complete room join or eight-player session works.

## Private and public player data

`Player` objects can contain a private rejoin token. Before roster, spectator, or game-state broadcasts, the code uses `toPublicPlayer` / `toPublicPlayers` to blank that field. The visible `NEON-####` rejoin code is a room-scoped alias, not the underlying token. The host sends the private token only in the direct `JOIN_APPROVED` message after approving the returning player. Do not treat the short code as a cryptographically strong password. The existing room code remains Sparrow's native invite identifier; shortening it safely would require a shared room-directory lookup that this database-free build does not provide, so it is intentionally unchanged.

Secret game codes are sent only to the relevant player during play and to the room for the Reveal phase. Spectator state synchronization does not include unrevealed codes.
