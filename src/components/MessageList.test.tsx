import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Message } from '../types'
import MessageList from './MessageList'

const message: Message = { id: 1, channelId: 1, body: 'привет', username: 'alice' }

describe('MessageList', () => {
  it('shows an empty-state notice when there are no messages', () => {
    render(<MessageList messages={[]} />)

    expect(screen.getByText('Сообщений пока нет. Напишите первым!')).toBeInTheDocument()
  })

  it('renders each message with its author', () => {
    render(<MessageList messages={[message, { id: 2, channelId: 1, body: 'как дела', username: 'bob' }]} />)

    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('привет')).toBeInTheDocument()
    expect(screen.getByText('bob')).toBeInTheDocument()
    expect(screen.getByText('как дела')).toBeInTheDocument()
  })

  it('scrolls to the latest message whenever the list changes', () => {
    const scrollSpy = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollSpy

    const { rerender } = render(<MessageList messages={[message]} />)
    expect(scrollSpy).toHaveBeenCalledTimes(1)

    rerender(<MessageList messages={[message, { id: 2, channelId: 1, body: 'ещё одно', username: 'bob' }]} />)
    expect(scrollSpy).toHaveBeenCalledTimes(2)
  })
})