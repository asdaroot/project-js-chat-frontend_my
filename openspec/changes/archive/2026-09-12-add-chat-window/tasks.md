## 1. Dependency and sessions

- [x] 1.1 Add `socket.io-client@^4` to dependencies (`npm install socket.io-client`), verify `package.json` lists it and the lockfile is updated
- [x] 1.2 Create `src/lib/session.ts` with `loadSession`/`saveSession`/`clearSession` over the `chat-session` localStorage key; verify with inline logic comments and `npx tsc -b`
- [x] 1.3 Bootstrap `App` auth state from `loadSession()` (lazy initializer), save session on successful login and signup, clear on logout; verify in the browser: login -> reload keeps the session -> logout -> reload opens the login form

## 2. Socket and seed infra

- [x] 2.1 Export `BASE_URL` from `src/lib/api.ts`; create `src/lib/socket.ts` with `createSocket()` returning `io(BASE_URL)`; verify `npx tsc -b` passes
- [x] 2.2 Move the authenticated view out of `App.tsx` into `src/components/ChatWindow.tsx` with `loadState: 'loading' | 'ready' | 'error'` (seed via `fetchData(token)`, retry button on error, user stays authenticated); verify the seed renders channels and messages from `GET /api/v1/data`

## 3. Chat window core

- [x] 3.1 Implement `ChannelSidebar` (channel list buttons, active highlight, add button `+`, rename and remove controls gated on `removable`), wire channel selection to `currentChannelId`; verify click switches the active channel
- [x] 3.2 Implement `MessageList` showing only messages of the selected channel sorted by id, with an empty-state notice when the channel has no messages; verify per-channel filtering against seeded data
- [x] 3.3 Implement `MessageForm` (input + send button, disabled send for whitespace-only text, keeps input on empty submit); verify empty/whitespace submit does not emit

## 4. Realtime messaging

- [x] 4.1 Connect the socket in `ChatWindow` via `useEffect` (connect after seed succeeds, `disconnect()` on cleanup); verify a connection is established on the backend log
- [x] 4.2 Sending: gate on `socket.connected`, `emit('newMessage', { body, channelId, username })`, rely on the server relay to append the message; on disconnected show «нет соединения с сервером» and keep the input; verify a sent message appears (single round-trip) and that no duplicates are shown
- [x] 4.3 Receiving: `socket.on('newMessage', ...)` appends the message to the right channel; verify a second browser tab posts a message visible in the first tab

## 5. Channel management dialogs

- [x] 5.1 Implement generic `Modal` (overlay click and Escape close, focus first input) and `ChannelDialog` with three modes (create/rename/remove) with trim-based non-empty validation for name fields and a confirm step for removal; verify each mode renders and validates
- [x] 5.2 Create: `emit('newChannel', { name })` -> on broadcast append the channel and close the dialog; on disconnected show error and keep dialog open; verify the new channel appears in the sidebar and the dialog closes
- [x] 5.3 Rename: `emit('renameChannel', { id, name })` -> on broadcast update the name in the sidebar; verify the sidebar shows the new name (own and other-client flows)
- [x] 5.4 Remove: `emit('removeChannel', { id })` -> drop channel + its messages, re-select first remaining channel when the removed one was selected; hide remove control for non-removable channels; verify removal across tabs and the re-selection rule

## 6. Styles

- [x] 6.1 Replace summary styles in `src/App.css` with the chat layout (sidebar + message panel + input row), active-channel highlight, remove/rename/add controls, and modal overlay/dialog styles; verify the window looks intentional at `npm run dev`

## 7. Cleanup and verification

- [x] 7.1 Remove the token display block and unused summary markup/styles from the authenticated view; verify nothing references `.token-display` or the summary
- [x] 7.2 Update `README.md` features (chat window, channels, realtime, session persistence) and remove the «token in memory only» note; verify the README matches the implemented behavior
- [x] 7.3 Run `npm run lint` and `npm run build`; verify both pass with no errors
- [x] 7.4 Manual end-to-end in the browser: login -> chat window with channels -> switch channels -> send a message -> create/rename/remove a channel (across two tabs) -> reload keeps the session -> logout returns to the login form