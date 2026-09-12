const SESSION_KEY = 'chat-session'

export interface StoredSession {
  token: string
  username: string
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (typeof parsed.token !== 'string' || typeof parsed.username !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: StoredSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}