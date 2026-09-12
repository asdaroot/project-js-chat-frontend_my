import type { ChatData } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function login(
  username: string,
  password: string,
): Promise<{ token: string; username: string }> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    throw new ApiError('Network error', null)
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  return response.json() as Promise<{ token: string; username: string }>
}

export async function fetchData(token: string): Promise<ChatData> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/api/v1/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new ApiError('Network error', null)
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  return response.json() as Promise<ChatData>
}