export interface Channel {
  id: number
  name: string
  removable: boolean
}

export interface Message {
  id: number
  channelId: number
  body: string
  username: string
}

export interface ChatData {
  channels: Channel[]
  currentChannelId: number
  messages: Message[]
}