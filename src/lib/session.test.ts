import { beforeEach, describe, expect, it } from 'vitest'
import { clearSession, loadSession, saveSession } from './session'

describe('session', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(loadSession()).toBeNull()
  })

  it('saves and loads a session round-trip', () => {
    saveSession({ token: 'abc', username: 'admin' })
    expect(loadSession()).toEqual({ token: 'abc', username: 'admin' })
  })

  it('uses the dedicated chat-session key', () => {
    saveSession({ token: 'abc', username: 'admin' })
    expect(localStorage.getItem('chat-session')).toBe(JSON.stringify({ token: 'abc', username: 'admin' }))
  })

  it('rejects corrupted JSON on load', () => {
    localStorage.setItem('chat-session', '{not json')
    expect(loadSession()).toBeNull()
  })

  it('rejects stored data that is not an object', () => {
    localStorage.setItem('chat-session', '"just a string"')
    expect(loadSession()).toBeNull()
  })

  it('rejects stored data missing required string fields', () => {
    localStorage.setItem('chat-session', JSON.stringify({ token: 'abc' }))
    expect(loadSession()).toBeNull()
  })

  it('rejects stored data with non-string fields', () => {
    localStorage.setItem('chat-session', JSON.stringify({ token: 123, username: true }))
    expect(loadSession()).toBeNull()
  })

  it('clears the stored session', () => {
    saveSession({ token: 'abc', username: 'admin' })
    clearSession()
    expect(loadSession()).toBeNull()
    expect(localStorage.getItem('chat-session')).toBeNull()
  })
})