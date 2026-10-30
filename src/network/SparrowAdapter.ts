import Sparrow from 'sparrow-rtc'
import type { NetworkAdapter } from './NetworkAdapter'
import type { GameEvent, RoomCode } from './types'

/**
 * ICE configuration for Sparrow-RTC.
 *
 * This fetches ICE servers from our own /api/turn endpoint, which
 * decides which TURN provider to use (Metered primary, Cloudflare
 * fallback) and returns fresh credentials.
 *
 * Benefits:
 *   • Real credentials never appear in the browser bundle
 *   • Provider switching is done in one place — server-side
 *   • Works identically on localhost (via Vite middleware) and in
 *     production (via Cloudflare Pages Functions)
 *
 * If the endpoint is unreachable, we fall back to public Google STUN
 * servers so at least same-network play still works.
 */
const rtcConfigurator = async (_ctx: { signaller: any }) => {
  const fallbackIceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  try {
    // No `?provider=` param → the endpoint uses DEFAULT_TURN_PROVIDER
    // and returns exactly ONE provider's URLs. This is what avoids the
    // race where both Metered and Cloudflare appear in iceServers and
    // the browser silently picks whichever allocates first.
    const response = await fetch('/api/turn')

    if (!response.ok) {
      console.warn(
        '[SparrowAdapter] /api/turn returned',
        response.status,
        '— using STUN only.'
      )
      return { iceServers: fallbackIceServers }
    }

    const data = (await response.json()) as {
      iceServers?: RTCIceServer[]
      provider?: string
      failures?: string[]
    }

    if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      console.info(
        '[SparrowAdapter] Loaded ICE servers from /api/turn (provider:',
        data.provider ?? 'unknown',
        ')'
      )
      if (data.failures && data.failures.length > 0) {
        console.warn(
          '[SparrowAdapter] Some TURN providers failed:',
          data.failures
        )
      }
      return { iceServers: data.iceServers }
    }

    console.warn(
      '[SparrowAdapter] /api/turn returned no iceServers — using STUN only.'
    )
    return { iceServers: fallbackIceServers }
  } catch (err) {
    console.warn(
      '[SparrowAdapter] Could not reach /api/turn — using STUN only.',
      err
    )
    return { iceServers: fallbackIceServers }
  }
}

// These event types are handled and, when appropriate, rebroadcast by
// the host application. They must never be blindly relayed peer-to-peer.

const MAX_MESSAGE_CHARS = 64 * 1024
const GAME_EVENT_TYPES = new Set([
  'HELLO', 'PLAYER_JOINED', 'PLAYER_LEFT', 'NAME_CHANGED', 'GAME_START',
  'LOCK_SUBMITTED', 'LOCK_STATUS', 'LOCK_CODE_ASSIGNED', 'PEEK_SHARED',
  'PHASE_CHANGE', 'BLUFF_SUBMITTED', 'CHALLENGE_SUBMITTED', 'GUESS_SUBMITTED',
  'GUESS_RESOLVED', 'CODES_REVEALED', 'ROUND_COMPLETE', 'GAME_STATE_SYNC',
  'ROSTER_SYNC', 'ROUND_SNAPSHOT', 'JOIN_APPROVED', 'JOIN_REJECTED', 'ROOM_FULL',
  'REASON_UPDATED', 'REJOIN_IDENTIFIED', 'SPECTATOR_JOIN', 'SPECTATOR_LEFT', 'REACTION',
])

function serializeGameEvent(event: GameEvent): string | null {
  try {
    const payload = JSON.stringify(event)
    if (payload.length > MAX_MESSAGE_CHARS) {
      console.warn('[SparrowAdapter] Refusing an oversized outgoing message:', event.type)
      return null
    }
    return payload
  } catch (error) {
    console.warn('[SparrowAdapter] Could not serialize outgoing message:', error)
    return null
  }
}

function isGameEvent(value: unknown): value is GameEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    GAME_EVENT_TYPES.has(value.type)
  )
}

const HOST_HANDLED_EVENTS = new Set([
  'HELLO',
  'PLAYER_JOINED',
  'PLAYER_LEFT',
  'GAME_START',
  'LOCK_SUBMITTED',
  'LOCK_STATUS',
  'LOCK_CODE_ASSIGNED',
  'PEEK_SHARED',
  'PHASE_CHANGE',
  'BLUFF_SUBMITTED',
  'CHALLENGE_SUBMITTED',
  'GUESS_SUBMITTED',
  'GUESS_RESOLVED',
  'CODES_REVEALED',
  'ROUND_COMPLETE',
  'GAME_STATE_SYNC',
  'ROSTER_SYNC',
  'ROUND_SNAPSHOT',
  'JOIN_APPROVED',
  'JOIN_REJECTED',
  'ROOM_FULL',
  'REASON_UPDATED',
  'REJOIN_IDENTIFIED',
  'SPECTATOR_JOIN',
  'SPECTATOR_LEFT',
  'REACTION',
])

export class SparrowAdapter implements NetworkAdapter {
  private hosted: any | null = null
  private joined: any | null = null
  private selfId: string | null = null
  private selfName: string | null = null
  private roomCode: RoomCode | null = null

  // Keep the actual host-side peer connections instead of relying on the
  // undocumented shape of hosted.connections when broadcasting messages.
  private hostConnections = new Set<any>()
  private hostConnectionPeerIds = new Map<any, string>()
  private hostPeerPlayerIds = new Map<any, string>()
  private activePlayerConnections = new Map<string, any>()

  private messageHandlers: Array<
    (event: GameEvent, senderId: string) => void
  > = []
  private playerJoinHandlers: Array<(playerId: string) => void> = []
  private playerLeaveHandlers: Array<(playerId: string) => void> = []

  // ---------- Lifecycle ----------

  async createRoom(playerName: string): Promise<RoomCode> {
    this.hosted = await Sparrow.host({
      rtcConfigurator,
      welcome: (prospect: any) => (connection: any) => {
        const peerId = String(
          prospect?.id ?? connection?.id ?? Math.random()
        )
        this.hostConnections.add(connection)
        this.hostConnectionPeerIds.set(connection, peerId)
        this.playerJoinHandlers.forEach((h) => h(peerId))
        this.wireConnection(connection, peerId)
        return () => {
          this.hostConnections.delete(connection)
          this.hostConnectionPeerIds.delete(connection)
          this.hostPeerPlayerIds.delete(connection)
          for (const [
            playerId,
            activeConnection,
          ] of this.activePlayerConnections) {
            if (activeConnection === connection)
              this.activePlayerConnections.delete(playerId)
          }
        }
      },
    } as any)

    const code: string = this.hosted.invite
    this.roomCode = code
    this.selfId = 'host'
    this.selfName = playerName
    return code
  }

  async joinRoom(roomCode: RoomCode, playerName: string): Promise<void> {
    this.joined = await Sparrow.join({
      invite: roomCode,
      rtcConfigurator,
      disconnected: () => {
        // Sparrow sometimes fires this on transient drops.
        // Give it a moment to see if it recovers before cleaning up.
        setTimeout(() => {
          if (this.joined) {
            this.playerLeaveHandlers.forEach((h) => h('host'))
            this.joined = null
            this.selfId = null
            this.selfName = null
          }
        }, 3000)
      },
    } as any)

    const connection = this.joined.connection

    // Assign a UNIQUE guest ID so multiple guests can coexist.
    const safeName =
      playerName.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'guest'
    const uniqueSuffix = Math.random().toString(36).slice(2, 8)
    this.selfId = `guest-${safeName}-${uniqueSuffix}`

    this.selfName = playerName
    this.roomCode = roomCode
    this.wireConnection(connection, 'host')
    this.playerJoinHandlers.forEach((h) => h('host'))
  }

  async leaveRoom(): Promise<void> {
    try {
      this.joined?.connection?.cable?.reliable?.close?.()
      for (const connection of this.hostConnections) {
        connection?.cable?.reliable?.close?.()
      }
      this.hosted?.close?.()
    } catch {
      // ignore
    }
    this.hostConnections.clear()
    this.hostConnectionPeerIds.clear()
    this.hostPeerPlayerIds.clear()
    this.activePlayerConnections.clear()
    this.hosted = null
    this.joined = null
    this.selfId = null
    this.selfName = null
    this.roomCode = null
  }

  // ---------- Sending and receiving ----------

  send(event: GameEvent): void {
    const payload = serializeGameEvent(event)
    if (!payload) return
    const sendOnConnection = (connection: any) => {
      const channel = connection?.cable?.reliable
      if (!channel) {
        console.warn('[SparrowAdapter] Cannot send: reliable channel missing')
        return
      }

      const transmit = () => {
        try {
          if (channel.readyState === 'open') {
            channel.send(payload)
          } else {
            console.warn(
              '[SparrowAdapter] Message not sent; channel state:',
              channel.readyState,
              'event:',
              event.type
            )
          }
        } catch (err) {
          console.warn('[SparrowAdapter] Failed to send:', err)
        }
      }

      if (channel.readyState === 'open') {
        transmit()
      } else if (channel.readyState === 'connecting') {
        // Queue this one payload until the data channel opens. Preserve any
        // existing onopen handler installed by wireConnection.
        const previousOnOpen = channel.onopen
        channel.onopen = (ev: Event) => {
          if (typeof previousOnOpen === 'function')
            previousOnOpen.call(channel, ev)
          transmit()
        }
      }
    }

    if (this.hosted) {
      for (const connection of this.hostConnections)
        sendOnConnection(connection)
    }

    if (this.joined) {
      sendOnConnection(this.joined.connection)
    }
  }

  sendToPlayer(playerId: string, event: GameEvent): void {
    // Guests have a single host connection; they cannot directly address peers.
    if (!this.hosted) {
      if (this.joined && playerId === 'host') this.send(event)
      return
    }

    const connection = this.activePlayerConnections.get(playerId)
    if (!connection || !this.hostConnections.has(connection)) {
      console.warn(
        '[SparrowAdapter] Private delivery target is not an active player:',
        playerId
      )
      return
    }
    const channel = connection?.cable?.reliable
    if (!channel) {
      console.warn(
        '[SparrowAdapter] Private delivery target is not connected:',
        playerId
      )
      return
    }
    const payload = serializeGameEvent(event)
    if (!payload) return
    const transmit = () => {
      if (channel.readyState !== 'open') return
      try {
        channel.send(payload)
      } catch (err) {
        console.warn('[SparrowAdapter] Private delivery failed:', err)
      }
    }
    if (channel.readyState === 'open') transmit()
    else if (channel.readyState === 'connecting') {
      channel.addEventListener('open', transmit, { once: true })
    }
  }

  setActivePlayerPeer(playerId: string, peerId: string): void {
    // A returning player may present a temporary connection ID. Once the host
    // resolves the branded code, rebind that peer connection to the original
    // stable player ID so private game events keep reaching the same player.
    const connection = [...this.hostConnections].find(
      (candidate) => this.hostConnectionPeerIds.get(candidate) === peerId
    )
    if (connection) {
      this.hostPeerPlayerIds.set(connection, playerId)
      this.activePlayerConnections.set(playerId, connection)
    }
  }

  sendToPeer(peerId: string, event: GameEvent): void {
    if (!this.hosted) return
    const connection = [...this.hostConnections].find(
      (candidate) => this.hostConnectionPeerIds.get(candidate) === peerId
    )
    const channel = connection?.cable?.reliable
    if (!channel) return
    const payload = serializeGameEvent(event)
    if (!payload) return
    const transmit = () => {
      if (channel.readyState !== 'open') return
      try {
        channel.send(payload)
      } catch (err) {
        console.warn('[SparrowAdapter] Private peer delivery failed:', err)
      }
    }
    if (channel.readyState === 'open') transmit()
    else if (channel.readyState === 'connecting')
      channel.addEventListener('open', transmit, { once: true })
  }

  onMessage(handler: (event: GameEvent, senderId: string) => void): void {
    this.messageHandlers.push(handler)
  }

  offMessage(handler: (event: GameEvent, senderId: string) => void): void {
    const i = this.messageHandlers.indexOf(handler)
    if (i >= 0) this.messageHandlers.splice(i, 1)
  }

  // ---------- Presence ----------

  onPlayerJoin(handler: (playerId: string) => void): void {
    this.playerJoinHandlers.push(handler)
  }

  onPlayerLeave(handler: (playerId: string) => void): void {
    if (!this.playerLeaveHandlers.includes(handler))
      this.playerLeaveHandlers.push(handler)
  }

  offPlayerLeave(handler: (playerId: string) => void): void {
    const i = this.playerLeaveHandlers.indexOf(handler)
    if (i >= 0) this.playerLeaveHandlers.splice(i, 1)
  }

  // ---------- Queries ----------

  getSelfId(): string | null {
    return this.selfId
  }

  getSelfName(): string | null {
    return this.selfName
  }

  getRoomCode(): RoomCode | null {
    return this.roomCode
  }

  getPeers(): string[] {
    return []
  }

  // ---------- Internals ----------

  private wireConnection(connection: any, peerId: string) {
    const reliable = connection.cable?.reliable
    if (!reliable) {
      console.warn('[SparrowAdapter] No reliable channel on connection')
      return
    }

    reliable.onmessage = (e: MessageEvent) => {
      try {
        const raw = typeof e.data === 'string' ? e.data : null
        if (!raw) return
        if (raw.length > MAX_MESSAGE_CHARS) {
          console.warn('[SparrowAdapter] Ignoring an oversized incoming message')
          return
        }
        const parsed: unknown = JSON.parse(raw)
        if (!isGameEvent(parsed)) {
          console.warn('[SparrowAdapter] Ignoring an unknown or malformed event')
          return
        }
        const event = parsed
        if (this.hosted && event.type === 'HELLO' && 'player' in event) {
          this.hostPeerPlayerIds.set(connection, event.player.id)
        }
        this.messageHandlers.forEach((h) => h(event, peerId))

        // -------- RELAY (host only) --------
        // Guests can only talk to the host directly. Only non-authoritative
        // events are blindly relayed; game-state events are validated and
        // rebroadcast by App.tsx.
        if (this.hosted && !HOST_HANDLED_EVENTS.has(event.type)) {
          for (const other of this.hostConnections) {
            if (other === connection) continue
            const otherChannel = other?.cable?.reliable
            if (otherChannel && otherChannel.readyState === 'open') {
              try {
                otherChannel.send(raw)
              } catch (err) {
                console.warn('[SparrowAdapter] Relay failed:', err)
              }
            }
          }
        }
        // -------- END RELAY --------
      } catch (err) {
        console.warn('[SparrowAdapter] Failed to parse message:', err)
      }
    }

    reliable.onopen = () => {
      // Data channel ready; send() will transmit queued messages.
    }

    reliable.onclose = () => {
      this.hostConnections.delete(connection)
      this.hostConnectionPeerIds.delete(connection)
      this.hostPeerPlayerIds.delete(connection)
      for (const [
        playerId,
        activeConnection,
      ] of this.activePlayerConnections) {
        if (activeConnection === connection)
          this.activePlayerConnections.delete(playerId)
      }
      this.playerLeaveHandlers.forEach((h) => h(peerId))
    }

    reliable.onerror = (err: any) => {
      console.warn('[SparrowAdapter] Reliable channel error:', err)
    }
  }
}