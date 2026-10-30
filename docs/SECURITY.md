# Security and Privacy Notes

## Credentials

- Keep Cloudflare TURN API tokens and Metered credentials in Cloudflare Pages encrypted secrets or a local ignored `.env.local` / `.dev.vars` file.
- Never put real credentials in React code, `src/`, `public/`, a README, screenshots, bug reports, or Git commits.
- `.env.local`, `.dev.vars`, and related local environment files are ignored by Git.
- If a credential was ever committed, uploaded, or shared, rotate/revoke it at the provider. Removing the file from the latest commit does not remove it from Git history.
- The public `/api/turn` endpoint returns temporary ICE server credentials. Do not publish the full JSON response. The Cloudflare API token must remain server-side.

## Player data

The current game asks for a display name only. Keep names short and avoid entering personal or sensitive information. Each player has a private, high-entropy rejoin token that is never displayed and is removed from public player objects before roster and state broadcasts. The host assigns a room-scoped `NEON-####` code as a convenient lookup code. A short code is easier to guess than the private token, so it is not treated as equivalent cryptographic strength: the host must approve every return request, and the private token is sent only to that peer after approval. The host keeps the short-code-to-player mapping in memory for the life of the room; it is not a permanent account system.

Unrevealed secret codes should remain private during play. The host coordinates game state; codes are revealed only in the Reveal phase. Spectator state sync intentionally excludes unrevealed secret codes.

## Current trust boundary

Neon Signal currently uses peer-to-peer WebRTC with the host player's browser coordinating the match. The host-side code validates important actions and calculates scores, but the host is still a participant's browser, not a trusted server. This release cannot guarantee protection against a determined player who modifies their client or crafts network messages.

Do not use this architecture for prizes, real-money rewards, paid entry, or other high-stakes competitive play. A future server-authoritative implementation should verify identity, player actions, phase windows, secret-code access, challenges, guesses, score updates, and elimination on the server.

## Reporting a problem

When sharing logs or screenshots, remove room codes, rejoin tokens, TURN usernames, TURN credentials, API tokens, email addresses, and any personal information. Share the console error text only after checking it for secrets.


## Response headers

Cloudflare Pages serves baseline headers from `public/_headers`: MIME-sniffing protection, a strict-origin referrer policy, clickjacking protection, and disabled camera, microphone, and geolocation permissions. This is a baseline, not a full security audit or a substitute for reviewing new third-party scripts and endpoints.
