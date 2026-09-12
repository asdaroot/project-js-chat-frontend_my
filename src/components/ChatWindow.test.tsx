import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatWindow from './ChatWindow'
import type { Channel, ChatData, Message } from '../types'
import { fetchData } from '../lib/api'
import { createSocket } from '../lib/socket'
import {
  createNextSocket,
  emittedEvents,
  getSocket,
  resetSocketMock,
  serverEmit,
  setMockConnected,
} from '../test/socketMock'

vi.mock('../lib/api', () => ({ fetchData: vi.fn() }))
vi.mock('../lib/socket', () => ({ createSocket: vi.fn() }))

const channels: Channel[] = [
  { id: 1, name: 'general', removable: true },
  { id: 2, name: 'random', removable: false },
  { id: 3, name: 'empty', removable: true },
]

const messages: Message[] = [
  { id: 1, channelId: 1, body: 'hello world', username: 'alice' },
  { id: 2, channelId: 1, body: 'hi there', username: 'bob' },
  { id: 3, channelId: 2, body: 'offtopic', username: 'carol' },
]

const chatData: ChatData = { channels, currentChannelId: 1, messages }

function renderChat(data: ChatData = chatData) {
  vi.mocked(fetchData).mockResolvedValue(data)
  render(<ChatWindow username="admin" token="tok" onLogout={vi.fn()} />)
  return waitFor(() => {
    expect(screen.getByRole('heading', { name: '# general' })).toBeInTheDocument()
    expect(getSocket()).not.toBeNull()
  })
}

const getMessageInput = () => screen.getByPlaceholderText('Введите сообщение…')

describe('ChatWindow', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetSocketMock()
    vi.mocked(createSocket).mockImplementation(() => createNextSocket() as never)
  })

  describe('loading and error', () => {
    it('shows a loading state while the initial data loads', () => {
      vi.mocked(fetchData).mockReturnValue(new Promise<ChatData>(() => {}))
      render(<ChatWindow username="admin" token="tok" onLogout={vi.fn()} />)

      expect(screen.getByText('Загрузка…')).toBeInTheDocument()
    })

    it('shows an error and retries the data load', async () => {
      vi.mocked(fetchData)
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue(chatData)
      const user = userEvent.setup()
      render(<ChatWindow username="admin" token="tok" onLogout={vi.fn()} />)

      expect(await screen.findByText('не удалось загрузить данные')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Повторить' }))

      expect(await screen.findByRole('heading', { name: '# general' })).toBeInTheDocument()
      expect(fetchData).toHaveBeenCalledTimes(2)
    })
  })

  describe('channels and selection', () => {
    it('lists channels in the sidebar and selects the default current channel', async () => {
      await renderChat()

      expect(screen.getAllByText('# general').length).toBeGreaterThan(0)
      expect(screen.getAllByText('# random').length).toBeGreaterThan(0)
      expect(screen.getByRole('button', { name: '# general' })).toHaveClass('channel active')
      expect(screen.getByRole('heading', { name: '# general' })).toBeInTheDocument()
      expect(screen.getByText('hello world')).toBeInTheDocument()
      expect(screen.getByText('hi there')).toBeInTheDocument()
      expect(screen.queryByText('offtopic')).not.toBeInTheDocument()
    })

    it('switches the message panel when another channel is selected', async () => {
      const user = userEvent.setup()
      await renderChat()

      await user.click(screen.getByRole('button', { name: '# random' }))

      expect(await screen.findByRole('heading', { name: '# random' })).toBeInTheDocument()
      expect(screen.getByText('offtopic')).toBeInTheDocument()
      expect(screen.queryByText('hello world')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: '# random' })).toHaveClass('channel active')
    })

    it('shows an empty-state notice for a channel without messages', async () => {
      const user = userEvent.setup()
      await renderChat()

      await user.click(screen.getByRole('button', { name: '# empty' }))

      expect(
        await screen.findByText('Сообщений пока нет. Напишите первым!'),
      ).toBeInTheDocument()
    })
  })

  describe('sending messages', () => {
    it('emits the message over the socket and clears the input', async () => {
      const user = userEvent.setup()
      await renderChat()

      await user.type(getMessageInput(), 'Привет всем')
      await user.click(screen.getByRole('button', { name: 'Отправить' }))

      expect(emittedEvents()).toContainEqual({
        event: 'newMessage',
        payload: { body: 'Привет всем', channelId: 1, username: 'admin' },
      })
      expect(getMessageInput()).toHaveValue('')
    })

    it('disables the send button for whitespace-only text and emits nothing', async () => {
      const user = userEvent.setup()
      await renderChat()

      const input = getMessageInput()
      expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()

      await user.type(input, '   ')
      expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Отправить' }))
      expect(emittedEvents()).toHaveLength(0)
    })

    it('shows a connection error and keeps the text when the socket is offline', async () => {
      const user = userEvent.setup()
      await renderChat()

      setMockConnected(false)
      await user.type(getMessageInput(), 'потерянно')
      await user.click(screen.getByRole('button', { name: 'Отправить' }))

      expect(screen.getByText('нет соединения с сервером')).toBeInTheDocument()
      expect(getMessageInput()).toHaveValue('потерянно')
      expect(emittedEvents()).toHaveLength(0)
    })
  })

  describe('realtime incoming events', () => {
    async function emitServer(event: string, payload: unknown) {
      await act(async () => {
        serverEmit(event, payload)
      })
    }

    it('appends a message broadcast for the selected channel', async () => {
      await renderChat()
      await emitServer('newMessage', {
        id: 10,
        channelId: 1,
        body: 'live from another client',
        username: 'dave',
      })

      expect(screen.getByText('live from another client')).toBeInTheDocument()
      expect(getSocket()).not.toBeNull()
    })

    it('stores messages for other channels and shows them once selected', async () => {
      const user = userEvent.setup()
      await renderChat()

      await emitServer('newMessage', {
        id: 11,
        channelId: 2,
        body: 'message to random',
        username: 'eve',
      })
      expect(screen.queryByText('message to random')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: '# random' }))
      expect(await screen.findByText('message to random')).toBeInTheDocument()
    })

    it('documents that incoming messages are not deduplicated by id', async () => {
      await renderChat()

      await emitServer('newMessage', { id: 50, channelId: 1, body: 'повтор', username: 'x' })
      await emitServer('newMessage', { id: 50, channelId: 1, body: 'повтор', username: 'x' })

      expect(screen.getAllByText('повтор')).toHaveLength(2)
    })

    it('adds a newly created channel to the sidebar', async () => {
      await renderChat()

      expect(screen.queryByText('# newchan')).not.toBeInTheDocument()
      await emitServer('newChannel', { id: 9, name: 'newchan', removable: true })

      expect(screen.getByRole('button', { name: '# newchan' })).toBeInTheDocument()
    })

    it('updates the sidebar name on a rename broadcast', async () => {
      await renderChat()

      await emitServer('renameChannel', { id: 1, name: 'renamed', removable: true })

      expect(screen.getByRole('heading', { name: '# renamed' })).toBeInTheDocument()
      expect(screen.queryByText('# general')).not.toBeInTheDocument()
    })

    it('drops the channel and its messages on a removal broadcast', async () => {
      await renderChat()

      await emitServer('removeChannel', { id: 2 })

      expect(screen.queryByRole('button', { name: '# random' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: '# general' })).toBeInTheDocument()
    })
  })

  describe('channel dialogs', () => {
    async function openCreateDialog(user: ReturnType<typeof userEvent.setup>) {
      await renderChat()
      await user.click(screen.getByRole('button', { name: 'Добавить канал' }))
      return within(await screen.findByRole('dialog'))
    }

    it('creates a channel, emits it and closes the dialog', async () => {
      const user = userEvent.setup()
      const dialog = await openCreateDialog(user)

      await user.type(dialog.getByLabelText('Имя канала'), 'учёба')
      await user.click(dialog.getByRole('button', { name: 'Отправить' }))

      expect(emittedEvents()).toContainEqual({
        event: 'newChannel',
        payload: { name: 'учёба' },
      })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('rejects an empty channel name inside the create dialog', async () => {
      const user = userEvent.setup()
      const dialog = await openCreateDialog(user)

      await user.type(dialog.getByLabelText('Имя канала'), '   ')
      await user.click(dialog.getByRole('button', { name: 'Отправить' }))

      expect(dialog.getByText('Имя канала не может быть пустым')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(emittedEvents()).toHaveLength(0)
    })

    it('shows a connection error when the socket is offline', async () => {
      const user = userEvent.setup()
      await renderChat()

      setMockConnected(false)
      await user.click(screen.getByRole('button', { name: 'Добавить канал' }))
      const dialog = within(screen.getByRole('dialog'))

      await user.type(dialog.getByLabelText('Имя канала'), 'канал')
      await user.click(dialog.getByRole('button', { name: 'Отправить' }))

      expect(dialog.getByText('нет соединения с сервером')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(emittedEvents()).toHaveLength(0)
    })

    it('renames the channel via the dialog and emits it', async () => {
      const user = userEvent.setup()
      await renderChat()

      await user.click(screen.getByRole('button', { name: 'Переименовать' }))
      const dialog = within(screen.getByRole('dialog'))

      await user.clear(dialog.getByLabelText('Имя канала'))
      await user.type(dialog.getByLabelText('Имя канала'), 'общее')
      await user.click(dialog.getByRole('button', { name: 'Переименовать' }))

      expect(emittedEvents()).toContainEqual({
        event: 'renameChannel',
        payload: { id: 1, name: 'общее' },
      })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('rejects an empty name in the rename dialog', async () => {
      const user = userEvent.setup()
      await renderChat()

      await user.click(screen.getByRole('button', { name: 'Переименовать' }))
      const dialog = within(screen.getByRole('dialog'))

      await user.clear(dialog.getByLabelText('Имя канала'))
      await user.click(dialog.getByRole('button', { name: 'Переименовать' }))

      expect(dialog.getByText('Имя канала не может быть пустым')).toBeInTheDocument()
      expect(emittedEvents()).toHaveLength(0)
    })

    it('removes a removable channel after confirmation', async () => {
      const user = userEvent.setup()
      await renderChat()

      await user.click(screen.getByRole('button', { name: 'Удалить' }))
      const dialog = within(screen.getByRole('dialog'))

      expect(dialog.getByText(/Уверены, что хотите удалить канал/)).toBeInTheDocument()
      await user.click(dialog.getByRole('button', { name: 'Удалить' }))

      expect(emittedEvents()).toContainEqual({ event: 'removeChannel', payload: { id: 1 } })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('offers no removal action for a non-removable channel', async () => {
      const user = userEvent.setup()
      await renderChat()

      await user.click(screen.getByRole('button', { name: '# random' }))
      await screen.findByRole('heading', { name: '# random' })

      expect(screen.queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument()
    })
  })

  describe('re-selection rules', () => {
    it('moves selection to the first remaining channel when the selected one is removed', async () => {
      await renderChat()

      await act(async () => {
        serverEmit('removeChannel', { id: 1 })
      })

      expect(await screen.findByRole('heading', { name: '# random' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '# general' })).not.toBeInTheDocument()
    })

    it('leaves the chat body hidden when the last channel is removed', async () => {
      const singleChannelData: ChatData = {
        channels: [{ id: 1, name: 'general', removable: true }],
        currentChannelId: 1,
        messages,
      }
      await renderChat(singleChannelData)

      await act(async () => {
        serverEmit('removeChannel', { id: 1 })
      })

      expect(screen.queryByRole('heading', { name: '# general' })).not.toBeInTheDocument()
      expect(screen.queryByText('# general')).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Чат' })).toBeInTheDocument()
    })
  })
})