## Purpose

Provides the main authenticated chat window of the messenger: a channel list with selection, viewing of a selected channel's messages with real-time updates, sending messages, and managing channels (creation, renaming, removal) through dialog windows.

## Requirements

### Requirement: User sees a chat window after login

After a successful login the system SHALL render a chat window with a sidebar listing the channels from the backend and a message panel showing the messages of the selected channel. The channel selected by default SHALL be the current channel returned by the backend in the initial data load.

#### Scenario: Chat window rendered after login

- **WHEN** the user enters the authenticated state and the backend data loads successfully
- **THEN** the chat window shows the channel list in the sidebar and the messages of the default current channel

#### Scenario: Default channel selected

- **WHEN** the chat window opens for the first time
- **THEN** the selected channel is the `currentChannelId` returned by the backend

#### Scenario: Initial data fails to load

- **WHEN** the initial data request fails after the user is authenticated
- **THEN** the system shows an error and keeps the user authenticated with an option to retry

### Requirement: User can select a channel

The system SHALL let the user pick any channel from the sidebar. When a channel is selected, the message panel SHALL show only the messages belonging to that channel.

#### Scenario: Selecting a channel shows its messages

- **WHEN** the user clicks a channel in the sidebar
- **THEN** that channel is highlighted as selected and the message panel shows only that channel's messages

#### Scenario: Empty channel state

- **WHEN** the selected channel has no messages
- **THEN** the message panel shows an empty-state notice instead of an empty list

### Requirement: User can send messages

The system SHALL provide a message form for the selected channel. Submitting a non-empty message SHALL emit it over Socket.IO with the selected channel id and the user's username, clear the input, and SHALL display the message in the panel when the backend confirms and rebroadcasts it.

#### Scenario: Sending a message

- **WHEN** the user submits a non-empty message text in the selected channel
- **THEN** the message is sent over Socket.IO, the input is cleared, and the message appears in that channel's message panel

#### Scenario: Empty message is not sent

- **WHEN** the user submits whitespace-only or empty text
- **THEN** nothing is emitted and the input keeps the user's current text

### Requirement: User receives messages in real time

While the window is open, the system SHALL listen for incoming message events and append messages to the corresponding channel, including messages sent by other clients.

#### Scenario: Incoming message appended

- **WHEN** a message event arrives over Socket.IO for a known channel from another client
- **THEN** the message is appended to that channel's message list and becomes visible when the channel is selected

### Requirement: User can create a channel

The system SHALL let the user create a channel through a dialog with a single name field. A name that is empty or whitespace-only SHALL be rejected with an error inside the dialog and SHALL NOT emit anything. On acceptance the system SHALL emit the creation over Socket.IO, add the new channel to the sidebar, and close the dialog.

#### Scenario: Creating a channel successfully

- **WHEN** the user opens the create-channel dialog, enters a non-empty name, and confirms
- **THEN** the channel is created over Socket.IO, appears in the sidebar, and the dialog closes

#### Scenario: Empty channel name

- **WHEN** the user confirms the create dialog with an empty or whitespace-only name
- **THEN** the dialog shows an error, nothing is emitted, and the dialog stays open

#### Scenario: Creating a channel when the connection is lost

- **WHEN** the user confirms the create dialog but no Socket.IO connection is available
- **THEN** the dialog shows an error and the channel is not added

### Requirement: User can rename a channel

The system SHALL let the user rename a channel through a dialog. The new name SHALL be non-empty after trimming. On acceptance the system SHALL emit the rename over Socket.IO and update the sidebar entry.

#### Scenario: Renaming a channel successfully

- **WHEN** the user opens the rename dialog for a channel, enters a non-empty name, and confirms
- **THEN** the channel name is updated over Socket.IO and the sidebar shows the new name

#### Scenario: Renaming with an empty name

- **WHEN** the user confirms the rename dialog with an empty or whitespace-only name
- **THEN** the dialog shows an error and nothing is emitted

### Requirement: User can remove a channel

The system SHALL let the user remove a removable channel after confirming the action in a dialog. Channels marked as non-removable by the backend SHALL NOT offer removal. When a channel is removed, its messages SHALL disappear from the view, and if it was the selected channel the selection SHALL move to the first remaining channel.

#### Scenario: Removing a selected channel

- **WHEN** the user confirms removal of the selected removable channel
- **THEN** the removal is emitted over Socket.IO, the channel and its messages disappear from the view, and the first remaining channel becomes selected

#### Scenario: Non-removable channel has no removal control

- **WHEN** the selected or listed channel is marked non-removable by the backend
- **THEN** no removal action is offered for it

### Requirement: Channel changes from other clients are applied live

The system SHALL listen for channel events over Socket.IO and apply them to the sidebar: newly created channels are added, renames update the names, and removals drop the channel and its messages; removing the currently selected channel performs the re-selection rule.

#### Scenario: Channel created by another client

- **WHEN** a channel creation event arrives over Socket.IO
- **THEN** the new channel appears in the sidebar

#### Scenario: Channel renamed by another client

- **WHEN** a channel rename event arrives over Socket.IO
- **THEN** the sidebar shows the updated name

#### Scenario: Channel removed by another client

- **WHEN** a channel removal event arrives over Socket.IO
- **THEN** the channel and its messages disappear, and the selection follows the re-selection rule