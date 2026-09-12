## ADDED Requirements

### Requirement: Authenticated session persists across reloads

The system SHALL save the token and username to localStorage after a successful login or signup, and SHALL restore the authenticated state on page load when a stored session is present. Logging out SHALL remove the stored session.

#### Scenario: Session restored on reload

- **WHEN** an authenticated user reloads the page
- **THEN** the system restores the authenticated state from localStorage and opens the chat window without asking for credentials again

#### Scenario: Session removed on logout

- **WHEN** the user logs out
- **THEN** the stored session is removed from localStorage, so a subsequent reload opens on the login form

## MODIFIED Requirements

### Requirement: User can log out

The authenticated view SHALL include a logout button. When clicked, the system SHALL clear the authenticated state and the persisted session, and return to the login form. The authenticated state SHALL survive a page reload while a stored session exists.

#### Scenario: Logging out

- **WHEN** the user clicks the logout button
- **THEN** the authenticated state and the persisted session are cleared and the login form is shown again

#### Scenario: Reload while authenticated

- **WHEN** an authenticated user reloads the page
- **THEN** the system restores the session from localStorage and opens the chat window again

## REMOVED Requirements

### Requirement: Authenticated user sees initial chat state

**Reason**: The placeholder summary view (channel names and message count) is replaced by the full chat window, whose behavior is now specified by the new `chat` capability.

**Migration**: The authenticated view is now the chat window described by capability `chat`.

### Requirement: Authenticated user sees their session token

**Reason**: Debug aid from the foundation milestone; token display is no longer part of the UI. The token now lives in localStorage for session persistence.

**Migration**: None — the UI no longer renders the token value.