import { useEffect, useRef } from 'react'
import type { Message } from '../types'

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  if (messages.length === 0) {
    return <p className="empty-state">Сообщений пока нет. Напишите первым!</p>
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div className="message" key={message.id}>
          <span className="message-username">{message.username}</span>
          <span className="message-body">{message.body}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}