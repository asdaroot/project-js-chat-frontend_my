## Purpose

Lets users create a chat account from the login screen: a username and password are submitted, validated client-side, and on success the user enters the authenticated state immediately.

## ADDED Requirements

### Requirement: Registration form validation

The system SHALL let the user register by providing a username, a password, and a password confirmation. The system SHALL reject the submission client-side with an error message when the username is empty, the password is shorter than 3 characters, or the password does not match its confirmation, and SHALL NOT send a registration request in those cases.

#### Scenario: Empty username

- **WHEN** the user submits the registration form with an empty username
- **THEN** the system shows a validation error and does not send a registration request

#### Scenario: Password too short

- **WHEN** the user submits the registration form with a password shorter than 3 characters
- **THEN** the system shows a validation error and does not send a registration request

#### Scenario: Password confirmation mismatch

- **WHEN** the user submits the registration form and the password does not match its confirmation
- **THEN** the system shows a validation error and does not send a registration request

### Requirement: Registration request handling

On a valid submission the system SHALL send the username and password to the backend signup endpoint. When the backend accepts the registration, the user SHALL enter the authenticated state and see the same authenticated view as after login, with a greeting containing the username. When the backend rejects the registration because the username is already taken, the system SHALL show the error message "такой пользователь уже существует" and remain on the registration form. When the request fails for network or server reasons, the system SHALL show a connection error and remain on the registration form.

#### Scenario: Successful registration

- **WHEN** the user submits a valid username and a password and the backend accepts the registration
- **THEN** the system enters the authenticated state and shows the authenticated view with a greeting containing the username

#### Scenario: Duplicate username

- **WHEN** the user submits a username that the backend reports as already taken
- **THEN** the system shows the error message "такой пользователь уже существует" and stays on the registration form

#### Scenario: Connection failure

- **WHEN** the registration request fails because the server cannot be reached
- **THEN** the system shows a connection error and stays on the registration form