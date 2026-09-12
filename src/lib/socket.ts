import { io, type Socket } from 'socket.io-client'
import { BASE_URL } from './api'

export type ChatSocket = Socket

export function createSocket(): ChatSocket {
  return io(BASE_URL)
}