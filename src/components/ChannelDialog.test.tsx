import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Channel } from '../types'
import ChannelDialog from './ChannelDialog'

const channel: Channel = { id: 1, name: 'general', removable: true }

describe('ChannelDialog create mode', () => {
  it('focuses the name field on open', () => {
    render(<ChannelDialog mode="create" onSubmit={() => true} onClose={() => {}} />)

    expect(screen.getByLabelText('Имя канала')).toHaveFocus()
  })

  it('submits the trimmed name and closes on a valid name', async () => {
    const onSubmit = vi.fn().mockReturnValue(true)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChannelDialog mode="create" onSubmit={onSubmit} onClose={onClose} />)

    await user.type(screen.getByLabelText('Имя канала'), '  новый  ')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(onSubmit).toHaveBeenCalledWith('новый')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('rejects an empty or whitespace name', async () => {
    const onSubmit = vi.fn().mockReturnValue(true)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChannelDialog mode="create" onSubmit={onSubmit} onClose={onClose} />)

    await user.type(screen.getByLabelText('Имя канала'), '   ')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(screen.getByText('Имя канала не может быть пустым')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows a connection error when the submission fails', async () => {
    const onSubmit = vi.fn().mockReturnValue(false)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChannelDialog mode="create" onSubmit={onSubmit} onClose={onClose} />)

    await user.type(screen.getByLabelText('Имя канала'), 'канал')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(screen.getByText('нет соединения с сервером')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on cancel', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChannelDialog mode="create" onSubmit={() => true} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape and on the close button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChannelDialog mode="create" onSubmit={() => true} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('ChannelDialog rename mode', () => {
  it('prefills the current name and submits a new one', async () => {
    const onSubmit = vi.fn().mockReturnValue(true)
    const user = userEvent.setup()
    render(<ChannelDialog mode="rename" channel={channel} onSubmit={onSubmit} onClose={() => {}} />)

    expect(screen.getByLabelText('Имя канала')).toHaveValue('general')

    await user.clear(screen.getByLabelText('Имя канала'))
    await user.type(screen.getByLabelText('Имя канала'), 'общее')
    await user.click(screen.getByRole('button', { name: 'Переименовать' }))

    expect(onSubmit).toHaveBeenCalledWith('общее')
  })

  it('rejects an empty name', async () => {
    const onSubmit = vi.fn().mockReturnValue(true)
    const user = userEvent.setup()
    render(<ChannelDialog mode="rename" channel={channel} onSubmit={onSubmit} onClose={() => {}} />)

    await user.clear(screen.getByLabelText('Имя канала'))
    await user.click(screen.getByRole('button', { name: 'Переименовать' }))

    expect(screen.getByText('Имя канала не может быть пустым')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('ChannelDialog remove mode', () => {
  it('asks for confirmation and confirms the removal', async () => {
    const onConfirm = vi.fn().mockReturnValue(true)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChannelDialog mode="remove" channel={channel} onConfirm={onConfirm} onClose={onClose} />)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Уверены, что хотите удалить канал/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows a connection error when the confirmation fails', async () => {
    const onConfirm = vi.fn().mockReturnValue(false)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChannelDialog mode="remove" channel={channel} onConfirm={onConfirm} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    expect(screen.getByText('нет соединения с сервером')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})