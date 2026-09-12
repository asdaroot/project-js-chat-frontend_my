## 1. API wrapper

- [x] 1.1 Add `signup(username, password)` to `src/lib/api.ts` mirroring the existing `login()` structure: POST `/api/v1/signup` with `Content-Type: application/json`, return `{ token, username }` on 201, throw `ApiError(message, status)` on non-ok (preserving status so 409 is distinguishable), throw `ApiError('Network error', null)` on network failure
- [x] 1.2 Verify `signup` against the running backend: `curl -X POST ${VITE_API_URL}/api/v1/signup -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin"}'` returns 409, and the mapping in the frontend reports it as an `ApiError` with status 409

## 2. Registration form UI

- [x] 2.1 Add `authMode: 'login' | 'signup'` state to `App.tsx` and render a tab switcher (Войти / Регистрация) that toggles between `LoginForm` and `SignupForm`; verify on the dev server that both tabs render and switching preserves the existing login flow
- [x] 2.2 Create `SignupForm` in `App.tsx` with username, password, and password-confirmation fields plus client-side validation (non-empty username, password >= 3 characters, confirmation matches); violation shows a Russian error and skips the request; verify each branch on the dev server
- [x] 2.3 Wire `SignupForm` submission to `signup()`: on success call the existing `onSuccess(token, username)` (reusing `AuthState.loggedIn`/`AuthenticatedView`), on 409 show "такой пользователь уже существует", on network failure show "не удалось подключиться к серверу"; verify success, duplicate (login with `admin`) and server-down cases on the dev server

## 3. Styles

- [x] 3.1 Add tab-switcher and registration-form styles to `src/App.css` consistent with the existing `auth-card` look, with the active tab highlighted; verify the tabbed layout matches the login screen visually

## 4. Verification

- [x] 4.1 Run `npm run lint` and `npm run build` and confirm both pass