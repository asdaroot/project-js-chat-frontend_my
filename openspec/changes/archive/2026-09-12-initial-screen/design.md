## Context

The frontend is a fresh Vite + React 19 + TypeScript template (boilerplate `App.tsx`, no specs yet). The backend is `@hexlet/chat-server` (Fastify + Socket.IO + JWT) running at `http://192.168.233.128:3000`, with CORS fully open (`origin: '*'`). Auth contract: `POST /api/v1/login` returns `{ token, username }` (401 on bad credentials) and `GET /api/v1/data` requires `Authorization: Bearer <token>`, returning `{ channels, currentChannelId, messages }`. See proposal.md for the why.

## Goals / Non-Goals

**Goals:**
- End-to-end proof of the auth path (`login` -> token -> `data`) with the least moving parts.
- A UI that clearly distinguishes logged-out (login form) and logged-in (greeting + data summary + logout) states.
- Zero new runtime dependencies; native `fetch` only.

**Non-Goals:**
- No signup form, no Socket.IO, no message sending, no channel CRUD, no token persistence (localStorage), no routing, no state-management library.

## Decisions

**1. In-memory auth state as a discriminated union.**
`App` holds `useState<{ status: 'loggedOut' } | { status: 'loggedIn'; token: string; username: string }>`. One variable, no boolean flag + parallel fields that can drift. The initial value is `loggedOut`, matching the spec's "reload requires re-login" behavior for free.

**2. Thin `src/lib/api.ts` over `fetch`.**
- `login(username, password): Promise<{ token, username }>` — `POST /api/v1/login` with JSON body; on non-2xx throws an `ApiError` carrying the HTTP status.
- `fetchData(token): Promise<Data>` — `GET /api/v1/data` with `Authorization: Bearer <token>`; throws `ApiError` on failure.
- Base URL read from `import.meta.env.VITE_API_URL`, falling back to `http://localhost:3000` when unset.

*Alternative considered:* `axios` — rejected, adds a dependency for what `fetch` does in ~30 lines. The full chat later uses Socket.IO anyway, where axios adds little; we can introduce it if a need appears.

**3. API errors mapped to two user-facing messages.**
The UI distinguishes an `HTTP 401` response ("неверный логин или пароль") from any other failure — network error, backend down, 5xx ("не удалось подключиться к серверу"). This avoids the misleading case where the backend isn't running but the user is told their password is wrong. For the data load, any failure shows "не удалось загрузить данные" with the user kept authenticated.

**4. No token/username storage outside component state.**
Deliberately matches the spec scenario "reload while authenticated". Persistence is a later change (localStorage + socket reconnect).

**5. Env config via Vite.**
New `.env.local` (ignored by git via `*.local`) sets `VITE_API_URL=http://192.168.233.128:3000`. `.env.example` is recreated cleanly: its current filename ends with a stray zero-width character (U+200E), which is deleted and the file rewritten with correct content.

**7. Dev server served on the LAN port 8000.**
The frontend runs on port `8000` (occupied in the team LAN is the backend on 3000, so Vite's default 5173 is replaced with `npm run dev -- --host --port 8000`). The app is opened at `http://192.168.233.128:8000` while the backend API stays at `http://192.168.233.128:3000`.

**8. Token visible in the authenticated view.**
The backend JWT token is rendered as a monospace block under the greeting (`.token-display` in `App.css`) so it is visible to the user after login. It lives only in the component state and is cleared on logout/reload.

**6. Styling stays in existing CSS files.**
Minimal layout for the centered card (form / authenticated view) in `App.css`; template logo assets removed.

## Risks / Trade-offs

- [Token in memory only -> every reload requires a new login] -> Accepted and specified intentionally for this milestone; the pattern changes in a later persistence change.
- [`variant: "error"` for 401 vs generic failure requires checking `ApiError.status`] -> Kept inside `App.tsx`'s one error handler; simple and testable.
- [`.env.example` filename carries a zero-width character today] -> Recreate the file (remove + write) so the name matches `.env.example` exactly.
- [Backend default port (5001) differs from the running instance (3000)] -> The running instance wins: `VITE_API_URL=http://192.168.233.128:3000` in `.env.local`.

## Migration Plan

Not applicable — this is a greenfield first screen; no previous behavior to migrate or roll back to.

## Open Questions

None that affect the specs, design, or tasks.