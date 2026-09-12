import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { ApiError, fetchData, login, signup } from './lib/api'
import { createSocket } from './lib/socket'
import { createNextSocket, resetSocketMock } from './test/socketMock'

vi.mock('./lib/api', () => {
  class ApiError extends Error {
    status: number | null
    constructor(message: string, status: number | null = null) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  }
  return {
    ApiError,
    login: vi.fn(),
    signup: vi.fn(),
    fetchData: vi.fn(),
  }
})

vi.mock('./lib/socket', () => ({ createSocket: vi.fn() }))

const chatData = {
  channels: [{ id: 1, name: 'general', removable: true }],
  currentChannelId: 1,
  messages: [],
}

const loginSubmit = () => screen.getByText('Войти', { selector: 'button[type="submit"]' })

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
    resetSocketMock()
    vi.mocked(fetchData).mockResolvedValue(chatData)
    vi.mocked(createSocket).mockImplementation(() => createNextSocket() as never)
  })

  describe('login', () => {
    it('shows the login form with prefilled admin credentials', () => {
      render(<App />)

      expect(screen.getByLabelText('Логин')).toHaveValue('admin')
      expect(screen.getByLabelText('Пароль')).toHaveValue('admin')
      expect(loginSubmit()).toBeInTheDocument()
    })

    it('opens the chat window on success and persists the session', async () => {
      vi.mocked(login).mockResolvedValue({ token: 'tok', username: 'admin' })
      const user = userEvent.setup()
      render(<App />)

      await user.click(loginSubmit())

      expect(await screen.findByRole('heading', { name: 'Чат' })).toBeInTheDocument()
      expect(login).toHaveBeenCalledWith('admin', 'admin')
      expect(JSON.parse(localStorage.getItem('chat-session')!)).toEqual({
        token: 'tok',
        username: 'admin',
      })
    })

    it('shows an error message on invalid credentials', async () => {
      vi.mocked(login).mockRejectedValue(new ApiError('Invalid credentials', 401))
      const user = userEvent.setup()
      render(<App />)

      await user.clear(screen.getByLabelText('Пароль'))
      await user.type(screen.getByLabelText('Пароль'), 'wrong')
      await user.click(loginSubmit())

      expect(await screen.findByText('неверный логин или пароль')).toBeInTheDocument()
      expect(loginSubmit()).toBeInTheDocument()
    })

    it('shows a connection error when the network fails', async () => {
      vi.mocked(login).mockRejectedValue(new ApiError('Network error', null))
      const user = userEvent.setup()
      render(<App />)

      await user.click(loginSubmit())

      expect(await screen.findByText('не удалось подключиться к серверу')).toBeInTheDocument()
    })
  })

  describe('registration', () => {
    async function openSignup(user: ReturnType<typeof userEvent.setup>) {
      render(<App />)
      await user.click(screen.getByRole('button', { name: 'Регистрация' }))
      return user
    }

    it('switches between login and registration tabs', async () => {
      const user = userEvent.setup()
      await openSignup(user)

      expect(screen.getByRole('heading', { name: 'Регистрация' })).toBeInTheDocument()
      expect(screen.getByLabelText('Подтвердите пароль')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Войти' }))
      expect(screen.getByRole('heading', { name: 'Вход в чат' })).toBeInTheDocument()
    })

    it('rejects an empty username without calling signup', async () => {
      const user = userEvent.setup()
      await openSignup(user)

      await user.type(screen.getByLabelText('Пароль'), 'secret')
      await user.type(screen.getByLabelText('Подтвердите пароль'), 'secret')
      await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

      expect(await screen.findByText('логин не может быть пустым')).toBeInTheDocument()
      expect(signup).not.toHaveBeenCalled()
    })

    it('rejects a password shorter than 3 characters', async () => {
      const user = userEvent.setup()
      await openSignup(user)

      await user.type(screen.getByLabelText('Логин'), 'newbie')
      await user.type(screen.getByLabelText('Пароль'), 'ab')
      await user.type(screen.getByLabelText('Подтвердите пароль'), 'ab')
      await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

      expect(await screen.findByText('минимум 3 символа')).toBeInTheDocument()
      expect(signup).not.toHaveBeenCalled()
    })

    it('rejects mismatched password confirmation', async () => {
      const user = userEvent.setup()
      await openSignup(user)

      await user.type(screen.getByLabelText('Логин'), 'newbie')
      await user.type(screen.getByLabelText('Пароль'), 'secret')
      await user.type(screen.getByLabelText('Подтвердите пароль'), 'secreT')
      await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

      expect(await screen.findByText('пароли не совпадают')).toBeInTheDocument()
      expect(signup).not.toHaveBeenCalled()
    })

    it('shows an error when the username is already taken', async () => {
      vi.mocked(signup).mockRejectedValue(new ApiError('Conflict', 409))
      const user = userEvent.setup()
      await openSignup(user)

      await user.type(screen.getByLabelText('Логин'), 'existing')
      await user.type(screen.getByLabelText('Пароль'), 'secret')
      await user.type(screen.getByLabelText('Подтвердите пароль'), 'secret')
      await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

      expect(await screen.findByText('такой пользователь уже существует')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Регистрация' })).toBeInTheDocument()
    })

    it('opens the chat window on a successful signup', async () => {
      vi.mocked(signup).mockResolvedValue({ token: 'tok', username: 'newbie' })
      const user = userEvent.setup()
      await openSignup(user)

      await user.type(screen.getByLabelText('Логин'), 'newbie')
      await user.type(screen.getByLabelText('Пароль'), 'secret')
      await user.type(screen.getByLabelText('Подтвердите пароль'), 'secret')
      await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

      expect(await screen.findByRole('heading', { name: 'Чат' })).toBeInTheDocument()
      expect(signup).toHaveBeenCalledWith('newbie', 'secret')
    })
  })

  describe('session', () => {
    it('restores the authenticated state from localStorage on load', async () => {
      localStorage.setItem('chat-session', JSON.stringify({ token: 'tok', username: 'admin' }))
      render(<App />)

      expect(await screen.findByRole('heading', { name: 'Чат' })).toBeInTheDocument()
      expect(fetchData).toHaveBeenCalledWith('tok')
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('logs out, clears the persisted session and returns to the login form', async () => {
      localStorage.setItem('chat-session', JSON.stringify({ token: 'tok', username: 'admin' }))
      const user = userEvent.setup()
      render(<App />)

      await screen.findByRole('heading', { name: 'Чат' })
      await user.click(screen.getByRole('button', { name: 'Выйти' }))

      expect(screen.getByRole('heading', { name: 'Вход в чат' })).toBeInTheDocument()
      expect(localStorage.getItem('chat-session')).toBeNull()
    })
  })
})