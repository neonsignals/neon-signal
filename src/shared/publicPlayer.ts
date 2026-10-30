import type { Player } from '@/network/types'

/** Remove the private rejoin token before a player record is broadcast. */
export function toPublicPlayer(player: Player): Player {
  return { ...player, playerToken: '' }
}

export function toPublicPlayers(players: Player[]): Player[] {
  return players.map(toPublicPlayer)
}
