import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, BASE_URL, fetchData, login, signup } from './api'

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('api', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('login', () => {
    it('posts credentials and returns token and username', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ token: 'tok', username: 'admin' }))
      const result = await login('admin', 'admin')

      expect(result).toEqual({ token: 'tok', username: 'admin' })
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin' }),
        }),
      )
    })

    it('throws ApiError with status 401 on invalid credentials', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 401))
      await expect(login('admin', 'wrong')).rejects.toMatchObject({ status: 401 })
    })

    it('throws ApiError when the network fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'))
      await expect(login('admin', 'admin')).rejects.toMatchObject({ status: null })
      expect.hasAssertions()
    })
  })

  describe('signup', () => {
    it('posts credentials and returns token and username', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ token: 'tok', username: 'newbie' }))
      const result = await signup('newbie', 'secret')

      expect(result).toEqual({ token: 'tok', username: 'newbie' })
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/signup`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'newbie', password: 'secret' }),
        }),
      )
    })

    it('throws ApiError with status 409 when the username is taken', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 409))
      await expect(signup('newbie', 'secret')).rejects.toMatchObject({ status: 409 })
    })

    it('throws ApiError when the network fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'))
      await expect(signup('newbie', 'secret')).rejects.toMatchObject({ status: null })
      expect.hasAssertions()
    })
  })

  describe('fetchData', () => {
    it('requests data with the Authorization header', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ channels: [], currentChannelId: 1, messages: [] }),
      )
      const data = await fetchData('tok')

      expect(data).toEqual({ channels: [], currentChannelId: 1, messages: [] })
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/data`,
        expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
      )
    })

    it('throws ApiError with the response status on failure', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 500))
      await expect(fetchData('tok')).rejects.toMatchObject({ status: 500 })
    })

    it('throws ApiError when the network fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'))
      await expect(fetchData('tok')).rejects.toMatchObject({ status: null })
      expect.hasAssertions()
    })
  })

  it('ApiError carries its name and status', () => {
    const err = new ApiError('boom', 401)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ApiError')
    expect(err.status).toBe(401)
  })
})