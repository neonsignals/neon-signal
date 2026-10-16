import type { GameEvent, RoomCode } from './types'

/**
 * What any network adapter must be able to do.
 *
 * Our app only calls methods on this interface — never on Netlib directly.
 * If we ever swap Netlib for another library, we write a new adapter that
 * implements this interface. No other files change.
 */
export interface NetworkAdapter {
  // ---------- Lifecycle ----------

  /** Create a room. Returns the room code once the room is open. */
  createRoom(playerName: string): Promise<RoomCode>

  /** Join an existing room by code. */
  joinRoom(roomCode: RoomCode, playerName: string): Promise<void>

  /** Leave the current room (or do nothing if not in one). */
  leaveRoom(): Promise<void>

  // ---------- Sending and receiving ----------

  /** Send an event to everyone in the room. */
  send(event: GameEvent): void

  /** Send a host-routed private event to one active player (host only). */
  sendToPlayer(playerId: string, event: GameEvent): void

  /** Send a private event to a specific host-side peer, including pending rejoiners. */
  sendToPeer(peerId: string, event: GameEvent): void

  /** Bind an accepted player ID to the current host-side peer connection. */
  setActivePlayerPeer(playerId: string, peerId: string): void

  /** Listen for incoming events. */
  onMessage(handler: (event: GameEvent, senderId: string) => void): void

  /** Stop listening for messages. */
  offMessage(handler: (event: GameEvent, senderId: string) => void): void

  // ---------- Presence ----------

  /** Called when a new peer joins the room. */
  onPlayerJoin(handler: (playerId: string) => void): void

  /** Called when a peer leaves the room. */
  onPlayerLeave(handler: (playerId: string) => void): void

  offPlayerLeave(handler: (playerId: string) => void): void

  // ---------- Queries ----------

  /** Your own peer ID. */
  getSelfName(): string | null

  /** The room code you're in (or null). */
  getRoomCode(): RoomCode | null

  /** Every peer currently connected to the room. */
  getPeers(): string[]
}