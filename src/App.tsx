import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, login, signup } from './lib/api'
import { clearSession, loadSession, saveSession } from './lib/session'
import ChatWindow from './components/ChatWindow'
import './App.css'

const INITIAL_USERNAME = 'admin'
const INITIAL_PASSWORD = 'admin'

type AuthState =
  | { status: 'loggedOut' }
  | { status: 'loggedIn'; token: string; username: string }

type AuthMode = 'login' | 'signup'

function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const session = loadSession()
    if (!session) return { status: 'loggedOut' }
    return { status: 'loggedIn', token: session.token, username: session.username }
  })
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  const handleAuthSuccess = (token: string, username: string) => {
    saveSession({ token, username })
    setAuth({ status: 'loggedIn', token, username })
  }

  const handleLogout = () => {
    clearSession()
    setAuth({ status: 'loggedOut' })
  }

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
            <LoginForm onSuccess={handleAuthSuccess} />
          ) : (
            <SignupForm onSuccess={handleAuthSuccess} />
          )}
        </section>
      ) : (
        <ChatWindow
          username={auth.username}
          token={auth.token}
          onLogout={handleLogout}
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

export default App