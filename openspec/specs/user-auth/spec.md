## Purpose

Provides the first authenticated screen of the chat frontend: users log in with their credentials, see that they are signed in, and can log out. Serves as the foundation milestone for the full chat UI.

## Requirements

### Requirement: User can log in with credentials
The system SHALL let the user authenticate by submitting a username and password. On success the user SHALL enter the authenticated state. On invalid credentials the system SHALL show an error message and keep the user logged out.

#### Scenario: Successful login
- **WHEN** the user submits a valid username and password
- **THEN** the system authenticates the user and shows the authenticated view with a greeting containing the username

#### Scenario: Invalid credentials
- **WHEN** the user submits a username or password that the backend rejects
- **THEN** the system shows an error message ("неверный логин или пароль") and keeps the user on the login form without entering the authenticated state

### Requirement: Authenticated user sees initial chat state
After login the system SHALL load the initial chat state from the backend (channel list and messages) and display a summary of it: the list of channel names and the message count. If loading fails, the system SHALL show an error while keeping the user authenticated.

#### Scenario: Initial state loaded
- **WHEN** login succeeds and the backend returns channels and messages
- **THEN** the system displays the channel names and the total message count

#### Scenario: Initial state fails to load
- **WHEN** the request for initial chat state fails after a successful login
- **THEN** the system shows an error message and keeps the user in the authenticated view

### Requirement: Authenticated user sees their session token
After login the system SHALL display the token returned by the backend as part of the authenticated view.

#### Scenario: Token shown after login
- **WHEN** the user is authenticated
- **THEN** the authenticated view displays the token that the backend returned on login

### Requirement: User can log out
The authenticated view SHALL include a logout button. When clicked, the system SHALL clear the authenticated state and return to the login form. The authenticated state SHALL NOT survive a page reload.

#### Scenario: Logging out
- **WHEN** the user clicks the logout button
- **THEN** the authenticated state is cleared and the login form is shown again

#### Scenario: Reload while authenticated
- **WHEN** an authenticated user reloads the page
- **THEN** the system opens on the login form because the authenticated state is kept in memory only