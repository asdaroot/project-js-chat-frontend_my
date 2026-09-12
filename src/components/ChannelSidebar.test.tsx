import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Channel } from '../types'
import ChannelSidebar from './ChannelSidebar'

const channels: Channel[] = [
  { id: 1, name: 'general', removable: true },
  { id: 2, name: 'random', removable: false },
]

describe('ChannelSidebar', () => {
  it('renders the list of channels', () => {
    render(
      <ChannelSidebar channels={channels} currentChannelId={1} onSelect={() => {}} onAdd={() => {}} />,
    )

    expect(screen.getByRole('button', { name: '# general' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '# random' })).toBeInTheDocument()
  })

  it('highlights the active channel', () => {
    render(
      <ChannelSidebar channels={channels} currentChannelId={2} onSelect={() => {}} onAdd={() => {}} />,
    )

    expect(screen.getByRole('button', { name: '# general' })).not.toHaveClass('channel active')
    expect(screen.getByRole('button', { name: '# random' })).toHaveClass('channel active')
  })

  it('calls onSelect with the channel id when a channel is clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ChannelSidebar channels={channels} currentChannelId={1} onSelect={onSelect} onAdd={() => {}} />)

    await user.click(screen.getByRole('button', { name: '# random' }))

    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('calls onAdd when the add button is clicked', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<ChannelSidebar channels={channels} currentChannelId={1} onSelect={() => {}} onAdd={onAdd} />)

    await user.click(screen.getByRole('button', { name: 'Добавить канал' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})