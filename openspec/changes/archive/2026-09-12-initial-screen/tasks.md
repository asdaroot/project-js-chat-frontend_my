## 1. Configuration

- [x] 1.1 Create `.env.local` with `VITE_API_URL=http://192.168.233.128:3000` and verify `cat .env.local` shows the line (gitignored via `*.local`)
- [x] 1.2 Recreate `.env.example`: remove the current file whose name ends with a zero-width character (U+200E) and write a clean `.env.example` documenting `VITE_API_URL`; verify `ls .env.example` and the file content are correct

## 2. Types

- [x] 2.1 Add `src/types.ts` with `Channel` (`id`, `name`, `removable`), `Message` (`id`, `channelId`, `body`, `username`), and `ChatData` (`channels`, `currentChannelId`, `messages`) interfaces; verify `npx tsc -b` passes

## 3. API layer

- [x] 3.1 Implement `ApiError` class carrying an HTTP status (or `null` for network failures); verify it is exported and constructible
- [x] 3.2 Implement `login(username, password)` in `src/lib/api.ts` that POSTs to `/api/v1/login` with a JSON body, parses `{ token, username }`, and throws `ApiError` on non-2xx or network failure; verify with `npx tsc -b` and a manual `curl`-equivalent via the running backend
- [x] 3.3 Implement `fetchData(token)` that GETs `/api/v1/data` with `Authorization: Bearer <token>` and returns `ChatData`, throwing `ApiError` otherwise; verify `npx tsc -b` passes

## 4. UI in App.tsx

- [x] 4.1 Replace boilerplate `App.tsx`: add a discriminated-union state `loggedOut | loggedIn { token, username }`; verify `npx tsc -b` passes
- [x] 4.2 Render the login form (username + password inputs prefilled `admin`/`admin`, submit button); verify the form renders in `npm run dev`
- [x] 4.3 On submit call `login()`; on `ApiError` with status 401 show "неверный логин или пароль", on any other failure show "не удалось подключиться к серверу"; verify wrong credentials show the message and do not switch state
- [x] 4.4 On successful login set the `loggedIn` state and greet "Вы вошли как <username>"; verify a valid `admin`/`admin` login reaches the authenticated view
- [x] 4.5 In the authenticated view, load initial data with `fetchData(token)` and render the channel names and message count; on failure show "не удалось загрузить данные" while staying authenticated; verify against the running backend
- [x] 4.6 Add a "Выйти" button that resets state to `loggedOut`; verify clicking it returns to the login form and that a page reload while authenticated opens on the login form again
- [x] 4.7 Display the backend-issued token in the authenticated view (`<code>` block under the greeting); verify the token renders after a successful `admin`/`admin` login and that `npx tsc -b` passes

## 5. Styling and cleanup

- [x] 5.1 Add minimal styles in `src/App.css` for the centered auth card, form, and data summary (remove template styles); verify the UI looks intentional in `npm run dev`
- [x] 5.2 Remove unused template assets (`src/assets/hero.png`, `react.svg`, `vite.svg`) and their imports; verify `npm run lint` passes without errors

## 6. Verification

- [x] 6.1 Run `npm run lint` and `npm run build` and verify both complete without errors
- [x] 6.2 Manually verify the full flow in the browser at `http://192.168.233.128:8000` (backend API on `http://192.168.233.128:3000`): bad login shows an error; `admin`/`admin` login shows greeting with channels and message count; logout returns to the form; reload while logged in returns to the form