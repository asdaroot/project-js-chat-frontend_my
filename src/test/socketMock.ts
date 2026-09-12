export interface EmittedEvent {
  event: string
  payload: unknown
}

export interface TestSocket {
  connected: boolean
  emitted: EmittedEvent[]
  on: (event: string, listener: (payload: never) => void) => void
  emit: (event: string, payload: unknown) => void
  disconnect: () => void
  serverEmit: (event: string, payload: unknown) => void
}

let currentSocket: TestSocket | null = null

export function createTestSocket(): TestSocket {
  const handlers: Record<string, Array<(payload: never) => void>> = {}
  const emitted: EmittedEvent[] = []
  return {
    connected: true,
    emitted,
    on: (event, listener) => {
      ;(handlers[event] ??= []).push(listener)
    },
    emit: (event, payload) => {
      emitted.push({ event, payload })
    },
    disconnect: () => {},
    serverEmit: (event, payload) => {
      for (const listener of handlers[event] ?? []) listener(payload as never)
    },
  }
}

export function createNextSocket(): TestSocket {
  currentSocket = createTestSocket()
  return currentSocket
}

export function resetSocketMock(): void {
  currentSocket = null
}

export function getSocket(): TestSocket | null {
  return currentSocket
}

export function setMockConnected(connected: boolean): void {
  if (currentSocket) currentSocket.connected = connected
}

export function serverEmit(event: string, payload: unknown): void {
  if (!currentSocket) throw new Error('no active socket mock')
  currentSocket.serverEmit(event, payload)
}

export function emittedEvents(): EmittedEvent[] {
  return currentSocket?.emitted ?? []
}