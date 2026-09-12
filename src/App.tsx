import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, fetchData, login, signup } from './lib/api'
import type { ChatData } from './types'
import './App.css'

const INITIAL_USERNAME = 'admin'
const INITIAL_PASSWORD = 'admin'

type AuthState =
  | { status: 'loggedOut' }
  | { status: 'loggedIn'; token: string; username: string }

type AuthMode = 'login' | 'signup'

function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loggedOut' })
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  return (
    <main className="auth-screen">
      {auth.status === 'loggedOut' ? (
        <section className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              className={authMode === 'login' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => setAuthMode('login')}
            >
              Войти
            </button>
            <button
              type="button"
              className={authMode === 'signup' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => setAuthMode('signup')}
            >
              Регистрация
            </button>
          </div>
          {authMode === 'login' ? (
            <LoginForm
              onSuccess={(token, username) => setAuth({ status: 'loggedIn', token, username })}
            />
          ) : (
            <SignupForm
              onSuccess={(token, username) => setAuth({ status: 'loggedIn', token, username })}
            />
          )}
        </section>
      ) : (
        <AuthenticatedView
          username={auth.username}
          token={auth.token}
          onLogout={() => setAuth({ status: 'loggedOut' })}
        />
      )}
    </main>
  )
}

function LoginForm({
  onSuccess,
}: {
  onSuccess: (token: string, username: string) => void
}) {
  const [username, setUsername] = useState(INITIAL_USERNAME)
  const [password, setPassword] = useState(INITIAL_PASSWORD)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const result = await login(username, password)
      onSuccess(result.token, result.username)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('неверный логин или пароль')
      } else {
        setError('не удалось подключиться к серверу')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Вход в чат</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Логин
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </>
  )
}

function SignupForm({
  onSuccess,
}: {
  onSuccess: (token: string, username: string) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!username) {
      setError('логин не может быть пустым')
      return
    }
    if (password.length < 3) {
      setError('минимум 3 символа')
      return
    }
    if (password !== confirmPassword) {
      setError('пароли не совпадают')
      return
    }

    setSubmitting(true)
    try {
      const result = await signup(username, password)
      onSuccess(result.token, result.username)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('такой пользователь уже существует')
      } else {
        setError('не удалось подключиться к серверу')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Регистрация</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Логин
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          Подтвердите пароль
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Регистрация…' : 'Зарегистрироваться'}
        </button>
      </form>
    </>
  )
}

function AuthenticatedView({
  username,
  token,
  onLogout,
}: {
  username: string
  token: string
  onLogout: () => void
}) {
  const [data, setData] = useState<ChatData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchData(token)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setError('не удалось загрузить данные')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <section className="auth-card">
      <header className="auth-card-header">
        <h1>Вы вошли как {username}</h1>
        <button type="button" className="logout-button" onClick={onLogout}>
          Выйти
        </button>
      </header>
      <p className="token-display">Токен: {token}</p>
      {error ? (
        <p className="auth-error">{error}</p>
      ) : data ? (
        <div className="chat-summary">
          <h2>Каналы</h2>
          <ul className="channel-list">
            {data.channels.map((channel) => (
              <li key={channel.id}>{channel.name}</li>
            ))}
          </ul>
          <p className="message-count">Сообщений: {data.messages.length}</p>
        </div>
      ) : (
        <p>Загрузка…</p>
      )}
    </section>
  )
}

export default App