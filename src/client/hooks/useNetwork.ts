import { useEffect, useState, useCallback, useRef } from 'react'
import { network } from '@/network'
import type { GameEvent } from '@/network'

type ReceivedEvent = { event: GameEvent; from: string }

export function useNetwork() {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [selfId, setSelfId] = useState<string | null>(null)
  const [selfName, setSelfName] = useState<string | null>(null)
  const [peers, setPeers] = useState<string[]>([])
  const [lastEvent, setLastEvent] = useState<ReceivedEvent | null>(null)
  const queueRef = useRef<ReceivedEvent[]>([])
  const activeEventRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setRoomCode((prev) => {
        const value = network.getRoomCode()
        return prev === value ? prev : value
      })
      setSelfId((prev) => {
        const value = network.getSelfId()
        return prev === value ? prev : value
      })
      setSelfName((prev) => {
        const value = network.getSelfName()
        return prev === value ? prev : value
      })
      setPeers((prev) => {
        const value = network.getPeers()
        return prev.length === value.length && prev.every((x, i) => x === value[i])
          ? prev
          : value
      })
    }, 150)

    const onMessage = (event: GameEvent, from: string) => {
      queueRef.current.push({ event, from })
      if (!activeEventRef.current) {
        activeEventRef.current = true
        const next = queueRef.current.shift() ?? null
        setLastEvent(next)
      }
    }

    network.onMessage(onMessage)
    return () => {
      clearInterval(interval)
      network.offMessage(onMessage)
    }
  }, [])

  const createRoom = useCallback(async (playerName: string) => {
    const code = await network.createRoom(playerName)
    setRoomCode(code)
    setSelfId(network.getSelfId())
    setSelfName(network.getSelfName())
    return code
  }, [])

  const joinRoom = useCallback(async (code: string, playerName: string) => {
    await network.joinRoom(code, playerName)
    setRoomCode(code)
    setSelfId(network.getSelfId())
    setSelfName(network.getSelfName())
  }, [])

  const leaveRoom = useCallback(async () => {
    await network.leaveRoom()
    setRoomCode(null)
    setSelfId(null)
    setSelfName(null)
    setPeers([])
    queueRef.current = []
    activeEventRef.current = false
    setLastEvent(null)
  }, [])

  const send = useCallback((event: GameEvent) => {
    network.send(event)
  }, [])

  const sendToPlayer = useCallback((playerId: string, event: GameEvent) => {
    network.sendToPlayer(playerId, event)
  }, [])

  const clearLastEvent = useCallback(() => {
    const next = queueRef.current.shift() ?? null
    if (next) {
      setLastEvent(next)
      return
    }
    activeEventRef.current = false
    setLastEvent(null)
    // A message can arrive between the queue check and React's next render.
    // onMessage will see activeEventRef=false and restart the queue.
  }, [])

  return {
    roomCode,
    selfId,
    selfName,
    peers,
    lastEvent,
    createRoom,
    joinRoom,
    leaveRoom,
    send,
    sendToPlayer,
    clearLastEvent,
  }
}
