import { useState } from 'react'
import type { FormEvent } from 'react'

interface MessageFormProps {
  onSend: (body: string) => boolean
}

export default function MessageForm({ onSend }: MessageFormProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!text.trim()) return
    if (onSend(text.trim())) {
      setText('')
      setError(null)
    } else {
      setError('нет соединения с сервером')
    }
  }

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      {error && <p className="auth-error">{error}</p>}
      <div className="message-form-row">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Введите сообщение…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
          Отправить
        </button>
      </div>
    </form>
  )
}