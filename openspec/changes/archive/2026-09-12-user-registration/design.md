## Context

See proposal.md — Why. The backend `POST /api/v1/signup` (`../project-js-chat-backend/src/routes.js:141`) returns `201 { token, username }` on success and `409 Conflict` when the username already exists, and performs no validation of its own. The frontend is a single React screen (`src/App.tsx`) with two states (`loggedOut` / `loggedIn`) toggled by `AuthState`, and `login()`/`fetchData()` in `src/lib/api.ts` already communicate with the backend via `fetch`, throwing `ApiError` with a `status` field on non-2xx.

## Goals / Non-Goals

**Goals:**
- Give the login screen a second mode — registration — reachable via tabs, no routing.
- Reuse the existing authenticated state and `AuthenticatedView` unchanged.
- Distinguish the two backend outcomes the frontend must surface: success (enter authenticated state) and duplicate username (show "такой пользователь уже существует").
- Validate input on the client before any network call, because the backend validates nothing.

**Non-Goals:**
- No react-router, no separate registration page/URL.
- No changes to the backend, `types.ts`, or `AuthenticatedView`.
- No persistent sessions (registration shares login's in-memory-only rule: reload returns to the form).

## Decisions

**D1 — Tab switcher via local state instead of routing.**
`App` gains `authMode: 'login' | 'signup'`. Two buttons render the active form; `LoginForm` and `SignupForm` both call the same `onSuccess(token, username)` callback passed down from `App`. Alternative (react-router with `/signup` route) rejected: one extra screen does not justify a dependency or URL structure the project does not otherwise use.

**D2 — `signup()` mirrors `login()` in `src/lib/api.ts`.**
Same shape: `fetch` to `${BASE_URL}/api/v1/signup` with `Content-Type: application/json`, body `{ username, password }`, wrap network failures as `ApiError('Network error', null)`, non-ok responses as `ApiError(message, status)`, success as `{ token, username }`. Because signup returns the same payload shape as login, the caller treats both identically. The preserved `status` lets the form branch on `409`.

**D3 — Error branch on `status === 409`.**
`ApiError.status` (already in `api.ts:5`) is the discriminator: `409` → "такой пользователь уже существует"; `null` → "не удалось подключиться к серверу". Mirrors the existing 401 handling in `LoginForm` (`App.tsx:52`).

**D4 — Client-side validation as the only gate.**
The backend stores whatever it receives (`routes.js:151`), so the form validates locally before submitting: non-empty username, password length >= 3, confirmation === password. Each violation shows a Russian error message and skips the request. Alternative (rely on backend errors) rejected because the backend never rejects invalid input — the account would be created.

**D5 — Shared authenticated state.**
`SignupForm` reuses the exact `onSuccess` contract of `LoginForm`; `AuthState.loggedIn` and `AuthenticatedView` are reused without modification, so logout, token display, and chat summary behave identically after signup.

## Risks / Trade-offs

- **Backend accepts any input** (empty password, short usernames): if a client ever bypasses the form checks, a flawed account is created → mitigation: validation is enforced in the form's submit path and duplicate check remains the backend's only guard; keeping the checks in one component keeps the surface small.
- **Confirm-password is frontend-only state**: a mismatch never reaches the network → low risk; covered by a scenario.
- **409 message text coupling**: the UI text is hardcoded in Russian, matching the existing login error style; safe for this educational project, no i18n layer present.

## Migration Plan

Frontend-only change; no deployment steps beyond shipping the rebuilt static bundle. Rollback = revert the single commit. No backend or data migration involved.