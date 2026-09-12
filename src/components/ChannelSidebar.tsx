import type { Channel } from '../types'

interface ChannelSidebarProps {
  channels: Channel[]
  currentChannelId: number
  onSelect: (id: number) => void
  onAdd: () => void
}

export default function ChannelSidebar({
  channels,
  currentChannelId,
  onSelect,
  onAdd,
}: ChannelSidebarProps) {
  return (
    <nav className="channels">
      <div className="channels-heading">
        <span>Каналы</span>
        <button type="button" className="btn btn-add" onClick={onAdd} aria-label="Добавить канал">
          +
        </button>
      </div>
      <ul className="channels-list">
        {channels.map((channel) => (
          <li key={channel.id}>
            <button
              type="button"
              className={channel.id === currentChannelId ? 'channel active' : 'channel'}
              onClick={() => onSelect(channel.id)}
            >
              # {channel.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}