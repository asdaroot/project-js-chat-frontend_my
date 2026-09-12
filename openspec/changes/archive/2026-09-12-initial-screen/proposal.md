## Why

The frontend is a fresh Vite/React template with no real functionality, while the backend (`@hexlet/chat-server`, running at `http://192.168.233.128:3000`) is already available. Before building the full chat, we need a first verifiable milestone: a login screen that proves the auth flow end-to-end (`POST /api/v1/login` -> `GET /api/v1/data`) and gives the user a clear sense of being signed in.

## What Changes

- Replace the Vite boilerplate `App.tsx` with a two-state UI: login form and authenticated view.
- Login form collects `username`/`password` (prefilled with `admin`/`admin`), calls `POST /api/v1/login`, shows a friendly error on failure (HTTP 401), and stores the returned token and username in component state only (no localStorage).
- Authenticated view greets the user ("Вы вошли как <username>"), fetches initial chat state via `GET /api/v1/data` (channels + message count), and renders a simple summary.
- Add a logout button that clears the authenticated state and returns to the login form.
- Introduce `src/lib/api.ts` with small `fetch`-based wrappers (`login`, `fetchData`) and `src/types.ts` with `Channel`/`Message` types.
- Configure the backend URL via Vite env: add `.env.local` with `VITE_API_URL=http://192.168.233.128:3000` and recreate `.env.example` (its filename contains a stray zero-width character).
- The Vite dev server is exposed on the network at `http://192.168.233.128:8000` (started with `npm run dev -- --host --port 8000`; port 5173 is not used).

## Capabilities

### New Capabilities
- `user-auth`: login against the backend, display the authenticated user, and log out. No signup, no token persistence across reloads in this change.

### Modified Capabilities
<!-- None — the project has no existing specs yet. -->

## Impact

- `src/App.tsx` — boilerplate demo replaced by login/authenticated views.
- `src/lib/api.ts`, `src/types.ts` — new modules.
- `src/App.css`, `src/index.css` — minimal styling for form and list.
- `src/assets/*` — template logos removed.
- `.env.local` (gitignored via `*.local`) and `.env.example` — backend URL config.
- No new runtime dependencies: native `fetch` only. `axios`/`socket.io-client` are explicitly out of scope for this change.
- Backend API contract used: `POST /api/v1/login` and `GET /api/v1/data` (Bearer token). No backend changes required.