import { describe, expect, it } from 'vitest'
import { toPublicPlayer, toPublicPlayers } from './publicPlayer'
import type { Player } from '@/network/types'

const privatePlayer: Player = {
  id: 'guest-example-123',
  name: 'Example',
  role: 'player',
  isHost: false,
  score: 12,
  joinedAt: 1,
  playerToken: 'P-private-rejoin-token',
  status: 'active',
}

describe('public player records', () => {
  it('removes the private rejoin token from a broadcast player', () => {
    expect(toPublicPlayer(privatePlayer).playerToken).toBe('')
    expect(toPublicPlayer(privatePlayer).name).toBe('Example')
  })

  it('removes private rejoin tokens from every broadcast player', () => {
    const result = toPublicPlayers([privatePlayer, { ...privatePlayer, id: 'another' }])
    expect(result).toHaveLength(2)
    expect(result.every((player) => player.playerToken === '')).toBe(true)
  })
})
