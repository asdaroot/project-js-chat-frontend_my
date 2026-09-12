## Context

See proposal.md — Why. Current frontend: one `App.tsx` holding `AuthState` (loggedOut | loggedIn) in memory, `LoginForm`/`SignupForm`, and a throwaway `AuthenticatedView` that shows a summary from a single `GET /api/v1/data` call. Backend `@hexlet/chat-server` exposes REST only for reading (`/api/v1/data`) and auth; all writes happen over Socket.IO without socket auth (see plugin.js "TODO add socket auth"). Server broadcasts every event to all connected clients, including the emitter. Message and channels seeded in-memory; `currentChannelId` points at the general channel.

## Goals / Non-Goals

**Goals:**
- One dependency added (`socket.io-client`) — everything else stays vanilla React + TS + CSS.
- Socket.IO is the source of truth for writes and for incoming data after the initial REST seed.
- The app stays a plain component-state React app — no Redux/Zustand, no router.

**Non-Goals:**
- No backend changes.
- No unread counters, no timestamp rendering (backend sends no timestamps), no i18n, no profanity filter, no drag-and-drop of channels.

## Decisions

**D1 — `socket.io-client` v4 as the only new dependency.**
Server is socket.io 4.8.3; client ^4 is compatible. Alternatives (polling `/api/v1/data`, axios) rejected: REST cannot create messages or channels, so sockets are mandatory anyway.

**D2 — Socket lifecycle owned by the chat window.**
`ChatWindow` mounts after authentication, opens one connection, and disconnects in its effect cleanup when the user logs out (unmount). No global socket singleton. The connection initially carries no token — the backend does not authenticate sockets.

**D3 — REST seeds state once; socket events are the single state-mutation channel.**
Initial `channels` / `messages` / `currentChannelId` come from `GET /api/v1/data`. After that, every change — including our own emits — is applied from the corresponding broadcast event (`newMessage`, `newChannel`, `removeChannel`, `renameChannel`). We never optimistically add on emit, which makes duplicates impossible because the server relays our own event back to us.

**D4 — State shape in `ChatWindow`.**
`channels: Channel[]`, `currentChannelId: number`, `messages: Message[]`, plus `loadState: 'loading' | 'ready' | 'error'` for the initial fetch. The visible message list is derived: `messages.filter(m => m.channelId === currentChannelId)` sorted by id. No memoized selector layer needed at this size.

**D5 — Emits are gated on connection state.**
`socket.connected` is checked before every emit; if disconnected, the dialog/form shows «нет соединения с сервером» and nothing is emitted instead of relying on socket.io's packet buffering (which would otherwise "succeed" later, violating the spec's connection-lost scenario).

**D6 — One dialog component, three modes.**
A generic `Modal` (overlay, Esc/overlay-click to close, focus the first input) wraps a shared `ChannelDialog` for create (`{ name: '' }`), rename (prefilled name), and remove (confirm text). Sidebar shows a remove control only for `removable: true` channels; rename is offered for all channels. The modal state in `ChatWindow` is `{ type: 'create' } | { type: 'rename'; channel: Channel } | { type: 'remove'; channel: Channel } | null`.

**D7 — Removal re-selection rule.**
On `removeChannel` the handler drops the channel and its messages from state; when the removed id equals the current selection, selection moves to the first channel remaining in the (filtered) array. Applies equally to our own removal and to removals broadcast by other clients. Edge case where all channels are gone cannot occur: `general` is non-removable, so the sidebar never drops to empty.

**D8 — Session persistence in localStorage.**
Helpers `loadSession` / `saveSession` / `clearSession` in `src/lib/session.ts` under key `chat-session`, storing `{ token, username }`. `App` initializes auth state lazily from `loadSession()`. Login/signup success calls `saveSession`; logout calls `clearSession`. The token block in the authenticated view is removed.

**D9 — Component split.**
`App.tsx` keeps only auth/session concerns. `ChatWindow.tsx` holds chat state and socket wiring; `ChannelSidebar`, `MessageList`, `MessageForm`, `ChannelDialog`, and `Modal` are presentational child components. BASE_URL is exported from `api.ts` and reused by `socket.ts` so the backend URL is defined once.

**D10 — Whitespace-only input is rejected.**
Messages and channel names are trimmed; empty-after-trim values are rejected client-side (channel dialog error / send blocked). No uniqueness check on channel names — the backend does not validate duplicates and none of the scenarios require it.

## Risks / Trade-offs

- [JWT stored in localStorage is readable by any XSS] → Accepted for this educational project; server uses a static secret and there are no auth-scoped socket privileges. Noted for any future hardening.
- [Relying on server relay instead of ack for applying our own writes] → Slightly slower feedback (one round-trip) but eliminates duplicate-message bugs; ack callbacks still used opportunistically where useful.
- [Socket broadcasts do not include a connection guarantee before data is seeded] → Messages arriving before the REST seed resolves could be lost. Mitigation: connect the socket only after the seed succeeds; if seeding fails, retry path connects on a successful retry.
- [No timestamps from backend] → Message list shows no time column; kept out of scope deliberately.

## Migration Plan

Frontend-only, static bundle. Rollback = revert the release commit. No backend or data migration.

## Open Questions

None that affect specs, approach, or tasks.