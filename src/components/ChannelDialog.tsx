import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Channel } from '../types'
import Modal from './Modal'

type ChannelDialogProps =
  | { mode: 'create'; onClose: () => void; onSubmit: (name: string) => boolean }
  | { mode: 'rename'; channel: Channel; onClose: () => void; onSubmit: (name: string) => boolean }
  | { mode: 'remove'; channel: Channel; onClose: () => void; onConfirm: () => boolean }

const CONNECTION_ERROR = 'нет соединения с сервером'

export default function ChannelDialog(props: ChannelDialogProps) {
  const [name, setName] = useState(props.mode === 'rename' ? props.channel.name : '')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (props.mode === 'remove') {
    const handleConfirm = () => {
      if (props.onConfirm()) {
        props.onClose()
      } else {
        setError(CONNECTION_ERROR)
      }
    }

    return (
      <Modal title="Удалить канал" onClose={props.onClose}>
        <p className="modal-text">
          Уверены, что хотите удалить канал <strong>#{props.channel.name}</strong>?
        </p>
        {error && <p className="auth-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={props.onClose}>
            Отмена
          </button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm}>
            Удалить
          </button>
        </div>
      </Modal>
    )
  }

  const title = props.mode === 'create' ? 'Добавить канал' : 'Переименовать канал'
  const submitLabel = props.mode === 'create' ? 'Отправить' : 'Переименовать'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Имя канала не может быть пустым')
      return
    }
    if (props.onSubmit(trimmed)) {
      props.onClose()
    } else {
      setError(CONNECTION_ERROR)
    }
  }

  return (
    <Modal title={title} onClose={props.onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label>
          Имя канала
          <input
            ref={inputRef}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            aria-invalid={error ? true : undefined}
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={props.onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}