import { useEffect, useRef, useState } from 'react'
import { fetchData } from '../lib/api'
import { createSocket, type ChatSocket } from '../lib/socket'
import type { Channel, Message } from '../types'
import ChannelDialog from './ChannelDialog'
import ChannelSidebar from './ChannelSidebar'
import MessageForm from './MessageForm'
import MessageList from './MessageList'

type LoadState = 'loading' | 'ready' | 'error'

type ModalState =
  | { type: 'create' }
  | { type: 'rename'; channel: Channel }
  | { type: 'remove'; channel: Channel }
  | null

interface ChatWindowProps {
  token: string
  username: string
  onLogout: () => void
}

export default function ChatWindow({ token, username, onLogout }: ChatWindowProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [currentChannelId, setCurrentChannelId] = useState<number | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [retry, setRetry] = useState(0)
  const [modal, setModal] = useState<ModalState>(null)
  const socketRef = useRef<ChatSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchData(token)
      .then((data) => {
        if (cancelled) return
        setChannels(data.channels)
        setMessages(data.messages)
        setCurrentChannelId(data.currentChannelId)
        setLoadState('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [token, retry])

  useEffect(() => {
    if (loadState !== 'ready') return
    const socket = createSocket()
    socketRef.current = socket

    socket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    socket.on('newChannel', (channel: Channel) => {
      setChannels((prev) => [...prev, channel])
    })

    socket.on('renameChannel', (channel: Channel) => {
      setChannels((prev) => prev.map((c) => (c.id === channel.id ? channel : c)))
    })

    socket.on('removeChannel', ({ id }: { id: number }) => {
      setChannels((prev) => prev.filter((c) => c.id !== id))
      setMessages((prev) => prev.filter((m) => m.channelId !== id))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [loadState])

  const isConnected = () => socketRef.current?.connected === true

  const activeChannelId = channels.some((c) => c.id === currentChannelId)
    ? currentChannelId
    : (channels[0]?.id ?? null)

  const sendMessage = (body: string): boolean => {
    if (!isConnected() || activeChannelId === null) return false
    socketRef.current!.emit('newMessage', { body, channelId: activeChannelId, username })
    return true
  }

  const createChannel = (name: string): boolean => {
    if (!isConnected()) return false
    socketRef.current!.emit('newChannel', { name })
    return true
  }

  const renameChannel = (channel: Channel, name: string): boolean => {
    if (!isConnected()) return false
    socketRef.current!.emit('renameChannel', { id: channel.id, name })
    return true
  }

  const removeChannel = (channel: Channel): boolean => {
    if (!isConnected()) return false
    socketRef.current!.emit('removeChannel', { id: channel.id })
    return true
  }

  const currentChannel = channels.find((c) => c.id === activeChannelId) ?? null
  const visibleMessages = messages
    .filter((m) => m.channelId === activeChannelId)
    .sort((a, b) => a.id - b.id)

  return (
    <section className="chat">
      <header className="chat-header">
        <h1>Чат</h1>
        <div className="chat-header-right">
          <span className="chat-username">{username}</span>
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </header>

      {loadState === 'error' && (
        <div className="chat-error">
          <p className="auth-error">не удалось загрузить данные</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setLoadState('loading')
              setRetry((r) => r + 1)
            }}
          >
            Повторить
          </button>
        </div>
      )}

      {loadState === 'loading' && <p className="loading">Загрузка…</p>}

      {loadState === 'ready' && currentChannel && (
        <div className="chat-body">
          <ChannelSidebar
            channels={channels}
            currentChannelId={currentChannel.id}
            onSelect={setCurrentChannelId}
            onAdd={() => setModal({ type: 'create' })}
          />
          <main className="chat-main">
            <header className="chat-channel-header">
              <h2># {currentChannel.name}</h2>
              <div className="channel-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setModal({ type: 'rename', channel: currentChannel })}
                >
                  Переименовать
                </button>
                {currentChannel.removable && (
                  <button
                    type="button"
                    className="btn btn-danger-ghost"
                    onClick={() => setModal({ type: 'remove', channel: currentChannel })}
                  >
                    Удалить
                  </button>
                )}
              </div>
            </header>
            <MessageList messages={visibleMessages} />
            <MessageForm onSend={sendMessage} />
          </main>
        </div>
      )}

      {modal?.type === 'create' && (
        <ChannelDialog
          mode="create"
          onSubmit={createChannel}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'rename' && (
        <ChannelDialog
          mode="rename"
          channel={modal.channel}
          onSubmit={(name) => renameChannel(modal.channel, name)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'remove' && (
        <ChannelDialog
          mode="remove"
          channel={modal.channel}
          onConfirm={() => removeChannel(modal.channel)}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  )
}