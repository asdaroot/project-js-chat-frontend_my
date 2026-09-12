import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessageForm from './MessageForm'

describe('MessageForm', () => {
  it('submits the trimmed text and clears the input on success', async () => {
    const onSend = vi.fn().mockReturnValue(true)
    const user = userEvent.setup()
    render(<MessageForm onSend={onSend} />)

    await user.type(screen.getByPlaceholderText('Введите сообщение…'), '  привет  ')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(onSend).toHaveBeenCalledWith('привет')
    expect(screen.getByPlaceholderText('Введите сообщение…')).toHaveValue('')
  })

  it('keeps the submit button disabled for empty or whitespace text', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<MessageForm onSend={onSend} />)

    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Введите сообщение…'), '   ')
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Отправить' }))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('shows a connection error and keeps the text when onSend fails', async () => {
    const onSend = vi.fn().mockReturnValue(false)
    const user = userEvent.setup()
    render(<MessageForm onSend={onSend} />)

    await user.type(screen.getByPlaceholderText('Введите сообщение…'), 'сообщение')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(screen.getByText('нет соединения с сервером')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Введите сообщение…')).toHaveValue('сообщение')
    expect(onSend).toHaveBeenCalledWith('сообщение')
  })
})