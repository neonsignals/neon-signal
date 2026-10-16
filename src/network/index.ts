import { SparrowAdapter } from './SparrowAdapter'

// A single shared network adapter for the entire app.
export const network = new SparrowAdapter()

// Re-export types so the rest of the app has one import path.
export type { GameEvent, Player, PlayerId, RoomCode, ConnectionStatus } from './types'
export type { NetworkAdapter } from './NetworkAdapter'