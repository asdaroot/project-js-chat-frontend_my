## Context

Проект — React 19 + TS 6 + Vite 8 + socket.io-client, без какой-либо тестовой инфраструктуры (нет vitest/jest, нет test-скрипта). Линт — oxlint. Опыта в спеке: 3 capability (chat, user-auth, user-registration), 13 требований — поведение полностью описано, работать пока некому подтверждать. Мотивация — в proposal.md.

Ключевые факты кода, влияющие на дизайн:
- `App.tsx` — вход/регистрация/сессия; логин-форма предзаполнена `admin/admin`.
- `ChatWindow.tsx` — ядро: состояние каналов/сообщений, `fetchData()` при mount, сокет создаётся `createSocket()` только когда `loadState === 'ready'`, `isConnected()` читает `socket.connected`.
- `lib/socket.ts` — тонкая обёртка `io(BASE_URL)`; фактически используемый API сокета: `on`, `emit`, `disconnect`, свойство `connected`.
- `lib/api.ts` — `login/signup/fetchData`, ошибки как `ApiError(status|null)`; для тестов реальный fetch не нужен.
- `lib/session.ts` — `localStorage` под ключом `chat-session`.
- `MessageList.tsx` — `bottomRef.scrollIntoView()` на каждое изменение `messages` (jsdom его не реализует).

## Goals / Non-Goals

**Goals:**
- Рабочая тестовая инфраструктура: vitest + jsdom + Testing Library, скрипт `npm test`, coverage.
- Полное покрытие юнит- и компонентными тестами без живого бэкенда: мок сокета (`lib/socket`) и мок API (`lib/api`).
- Тесты-спек : каждое из 13 требований спеки имеет проверяющий тест; плюс тесты на сверх-спековые поведения, фиксирующие текущее поведение без его изменения.

**Non-Goals:**
- Изменения рантайм-поведения (вариант A): авто-скролл, дедупликация, empty-state «нет каналов» остаются как есть, тесты их просто документируют.
- E2E против живого `@hexlet/chat-server`, CI-запуск, изменения `.env`.
- Правки спек-требований (`skip_specs: true` задан) и функционального кода `src/` (допустимы лишь минимальные правки ради тестируемости).

## Decisions

### 1. Стек: Vitest + @testing-library/react + @testing-library/user-event + jsdom

Автоматически переиспользует конфиг Vite, ESM/TS из коробки, быстрый watch. Альтернативы отклонены: Jest — требует ts-jest/babel и конфликтует с ESM+Vite; Cypress Component Testing — тяжелее и предназначен для браузерных сценариев. Версии: RTL 16 и user-event 14 совместимы с React 19.

### 2. Мок на границе модулей, а не внутри

В компонентных тестах мокаем собственные модули `lib/socket` и `lib/api` (`vi.mock`), а не socket.io-client и fetch напрямую. Так проверяется поведение компонентов, а обёртки получают собственные юнит-тесты (`lib/api.test.ts` против `vi.stubGlobal('fetch', ...)`; `lib/session.test.ts` против настоящего jsdom-localStorage). Мок на уровне `lib/socket` — рекомендация против `vi.mock('socket.io-client')`: у нас тонкая обёртка, и нас не интересуют внутренности библиотеки.

### 3. Контролируемый мок сокета

ChatWindow использует `on`, `emit`, `disconnect` и свойство `connected`. Мок-факторика создаёт объект с этим API, хранит реестр подписчиков (`on`) и журнал эмитов (`emit`), плюс свойство `connected` (по умолчанию `true` — для тестов ошибок выставляем `false`). Паттерн подключения из-за хойстинга `vi.mock`:

```
const { createMockSocket } = vi.hoisted(() => { /* factory */ })
vi.mock('../lib/socket', () => ({ createSocket: () => createMockSocket() }))
```

Перед каждым тестом сокет сбрасывается (`beforeEach` → сброс реестра/журнала/`connected`). Тест «достаёт» тот же экземпляр через `createMockSocket()` и может: вызвать обработчик входящего события (симулировать broadcast), проверить `emitted` (что именно отправлено), выставить `connected = false` (сценарии «нет соединения»). Эмит входящих событий оборачивается в `act()`.

### 4. Среда и setup

- `vitest.config.ts` через `mergeConfig(viteConfig, defineConfig({ test: ... }))` — переиспользует react-плагин.
- `test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'] }`.
- `src/test/setup.ts`: подключить `@testing-library/jest-dom` (matchers), заглушить `HTMLElement.prototype.scrollIntoView = vi.fn()` (jsdom его не имеет), cleanup после каждого теста (с `globals: true` RTL регистрирует авто-cleanup сам; заглушку функции-скролла сбрасывать в `beforeEach` нельзя — она глобальная, поэтому просто всегда `vi.fn()`).

### 5. Типизация тестовых файлов

`tsconfig.app.json` (сборка `tsc -b`) сейчас включает `src` целиком. Тест-файлы из продакшен-сборки исключаем: добавить в `tsconfig.app.json` `"exclude": ["**/*.test.ts", "**/*.test.tsx", "src/test"]`. Для редактора/типизации тестов — отдельный `tsconfig.vitest.json` на базе app-конфига с `types: ["vitest/globals", "@testing-library/jest-dom"]`. Скрипт `test:types` (необязательный) прогоняет `tsc --noEmit -p tsconfig.vitest.json`.

### 6. Размещение тестов

Рядом с кодом (`colocated`), как заведено в проекте: `src/lib/session.test.ts`, `src/lib/api.test.ts`, `src/App.test.tsx`, `src/components/ChatWindow.test.tsx`, `src/components/ChannelSidebar.test.tsx`, `src/components/MessageList.test.tsx`, `src/components/MessageForm.test.tsx`, `src/components/ChannelDialog.test.tsx`. Отдельный `Modal.test.tsx` не обязателен — Modal покрывается через диалоги канала; пусть на усмотрение реализации.

### 7. Отображение тестов на спек-требования

| Capability | Требования | Файлы тестов |
|---|---|---|
| user-registration (2) | валидация, signup 409/сеть/успех | `App.test.tsx` |
| user-auth (3) | вход, сессия localStorage, logout | `App.test.tsx`, `lib/session.test.ts` |
| chat (8) | окно/список/выбор, отправка, realtime, CRUD, re-selection | `ChatWindow.test.tsx` + остальные компоненты |

Сверх-спековые тесты (фиксируют как есть): yank-скролл в `MessageList.test.tsx`; отсутствие дедупликации и отсутствие empty-state «без каналов» — в `ChatWindow.test.tsx`.

## Risks / Trade-offs

- **Мок уходит от реального socket.io** → используем только фактически потребляемый API методов (`on/emit/disconnect/connected`); границу мока держим на собственной обёртке `lib/socket`, чтобы при изменении сигнатур правки были точечными. Живой E2E сознательно вне объёма.
- **`scrollIntoView` не реализован в jsdom** → заглушка в setup; поведение авто-скролла проверяется вызовом функции, а не реальной геометрией.
- **Асинхронность fetch/сокета** → `waitFor`/`findBy*`/`act()`; иначе хрупкие тесты и flood предупреждений act. Митигируем чётким ожиданием состояний (loading → ready → render).
- **React 19 vs старые версии RTL/jest-dom** → зафиксировать совместимые мажорные версии (RTL 16.x) в зависимостях.
- **Скрипт `build` (`tsc -b`) может подхватить тесты** → исключение тестов из `tsconfig.app.json` (решение 5); проверяется зелёным `npm run build`.

## Migration Plan

Дев-зависимости и новые файлы; обратная совместимость не требуется. Откат — удаление devDependencies/конфига и тест-файлов, рантайм не затрагивается.

## Open Questions

Нет.