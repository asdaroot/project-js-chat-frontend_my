## Why

The backend already exposes `POST /api/v1/signup`, which on success answers `201 { token, username }` (identical in shape to login) and `409 Conflict` for a duplicate username. The frontend only offers login today, so new users cannot create an account. A registration form gives users a way to join the chat without relying on the default `admin` account.

## What Changes

- Add a `signup()` API wrapper in `src/lib/api.ts` that posts `{ username, password }` to `/api/v1/signup` and returns `{ token, username }` on 201.
- Add a form-mode switcher (Войти / Регистрация tabs) next to the login form on the same screen, without routing.
- Add a `SignupForm` with three fields: username, password, and a password confirmation.
- On successful signup enter the same authenticated state as login; on 409 show an error message "такой пользователь уже существует"; on network failure show the existing connection error.
- Validate on the client before submitting: non-empty username, password at least 3 characters, password confirmation matches. The backend has no validation of its own.

## Capabilities

### New Capabilities
- `user-registration`: Users can create an account by submitting a username and a password. On success the user enters the authenticated state; a duplicate username shows an error; invalid input is rejected client-side.

### Modified Capabilities
<!-- None: the existing user-auth requirements (login, chat summary, token display, logout) are unchanged. -->

## Impact

- `src/lib/api.ts`: adds `signup()`. `ApiError`, `login()`, `fetchData()` untouched.
- `src/App.tsx`: adds `authMode` state ('login' | 'signup'), tab switcher, and `SignupForm` component. `AuthenticatedView` and `AuthState` re-used unchanged.
- `src/App.css`: styles for the tab switcher and registration form.
- No new dependencies, no changes to `types.ts`, no routing added.