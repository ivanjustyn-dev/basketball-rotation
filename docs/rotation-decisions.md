# Basketball Rotation App — Product Decision Record

This document records the agreed MVP behavior for the basketball rotation app.

## Product Scope

The app is a mobile-first basketball rotation tool for pickup games.

MVP constraints:

- Frontend-only application.
- Deployed to GitHub Pages.
- Uses browser `localStorage` for persistence.
- No backend, database, login, or server-side sync.
- Simple UI optimized for live game operation.

## Core Concepts

### Registered Players

Registered players are the permanent player list saved in `localStorage`.

Rules:

- Players are registered through a popup/modal with a textarea.
- One player name per line.
- Registered players are not automatically checked in.
- Registered players persist across game days.
- Registered players can be renamed.
- Registered players can be deleted.
- Deleting a registered player removes them from all active session state.

Duplicate handling:

- Trim leading/trailing whitespace.
- Ignore blank lines.
- Detect duplicate names case-insensitively.
- Example duplicates: `Ivan`, `ivan`, ` IVAN `.

### Game Day Session

A game day session is the active rotation state for a day/run.

Rules:

- A session is manually started/reset.
- Do not auto-reset at midnight.
- `Start New Game Day` clears active session state but keeps registered players.
- There is no `Reset Everything` / full localStorage wipe option in MVP.

Session state includes:

- Checked-in players.
- Queue.
- Court slots.
- Resting / Out players.
- Player consecutive-win counts.
- Last winner-action snapshot for undo.

### Checked-In Players

Only checked-in players can be considered for rotation.

Rules:

- Registration and check-in are separate actions.
- Check-in order is based on the exact order players are checked in.
- New check-ins are added to the bottom of the queue.
- A player cannot appear twice in active rotation.
- Re-check-in is allowed only when the player is in `Resting / Out`.
- Re-checking in a `Resting / Out` player returns them to the bottom of the queue.

The registered-player list should show each player status:

- `Not Checked In`
- `Queue #n`
- `On Court - Team A`
- `On Court - Team B`
- `Resting / Out`

## Rotation Model

### Flat Player Queue

The app uses one flat player queue at all times.

Rules:

- Players are not permanently locked to teams.
- Teams are temporary groups made from court slots.
- Court players are temporarily removed from the queue while playing.
- When players rotate out, they return to the queue as individual players.

### Court

The court has two teams with five slots each.

```txt
Team A: slot 1, slot 2, slot 3, slot 4, slot 5
Team B: slot 1, slot 2, slot 3, slot 4, slot 5
```

Rules:

- Empty court slots are allowed.
- Winner buttons are disabled unless both teams have exactly 5 players.
- A game result can only be recorded for a full 5v5 court.
- The app does not need a separate `Start Game` or `Start Next Game` flow.

### Fill Empty Slots

The app has a `Fill Empty Slots` button.

Rules:

- It fills empty court slots from the front of the queue.
- It fills left to right:
  1. Team A slot 1
  2. Team A slot 2
  3. Team A slot 3
  4. Team A slot 4
  5. Team A slot 5
  6. Team B slot 1
  7. Team B slot 2
  8. Team B slot 3
  9. Team B slot 4
  10. Team B slot 5
- It stops when the court is full.
- It stops when the queue is empty.
- It is disabled when the queue is empty.
- It does not increment streaks.
- It does not reset streaks.
- It preserves each player's existing streak value.

## Game Result Rules

The game ends when the organizer taps either:

- `Team A Won`
- `Team B Won`

When a winner is recorded:

- Winning players gain `+1` consecutive win.
- Losing players reset to `0W`.
- Losing players leave the court and go to the bottom of the queue.
- Winning players with fewer than 2 consecutive wins stay on court.
- Winning players who reach 2 consecutive wins rotate out.
- Two-win winners reset to `0W` when they rotate out.

### Queue Placement After Result

After recording a result:

1. Existing queue remains first.
2. Two-win winning players are appended next.
3. Losing players are appended after them.

Example:

```txt
Court:
Team A: A B D E F
Team B: K L M N O

Queue:
P Q R S T

Team A wins.
A B D E reach 2W.
F has 1W and stays.
```

Queue before filling empty slots:

```txt
P Q R S T A B D E K L M N O
```

Court after result:

```txt
Team A: _ _ _ _ F
Team B: _ _ _ _ _
```

After `Fill Empty Slots`:

```txt
Team A: P Q R S F
Team B: T A B D E
Queue: K L M N O
```

Note: the exact visual slot position of a staying player may be preserved unless the user manually edits the court. Automatic filling should still use the left-to-right empty-slot rule.

## Player-Based Win Streaks

Win streaks are tied to players, not teams.

Each player has:

```ts
consecutiveWins: 0 | 1 | 2
```

Rules:

- A winning player increments by 1.
- A losing player resets to 0.
- A player who rests/out resets to 0.
- A player manually removed from court resets to 0.
- A player who reaches 2 wins rotates out.
- A winning player with fewer than 2 wins may stay on court.

Example:

```txt
Game 1:
Team A: A B C D E wins
A B C D E = 1W

C rests.
F fills the empty slot.

Game 2:
Team A: A B D E F wins
A B D E = 2W
F = 1W

A B D E rotate out.
F may stay.
```

## Resting / Out

MVP uses one combined inactive list: `Resting / Out`.

Rules:

- `Resting` and `Checked Out` are not separate states in MVP.
- A player in `Resting / Out` remains checked in for today.
- A player in `Resting / Out` is excluded from rotation.
- Returning from `Resting / Out` puts the player at the bottom of the queue.
- Tapping `Check In` for a `Resting / Out` player behaves the same as returning them to the queue.

When a queue player is moved to `Resting / Out`:

- Remove from queue.
- Move to `Resting / Out`.
- Reset `consecutiveWins` to 0.

When a court player is moved to `Resting / Out`:

- Remove from court.
- Move to `Resting / Out`.
- Reset `consecutiveWins` to 0.
- Leave an empty court slot.
- Do not auto-fill immediately.

## Manual Editing

Manual edits are allowed because real games need correction.

MVP allows:

- Edit current court players.
- Reorder queue.
- Move queue players up/down.
- Move queue player to top.
- Move player to `Resting / Out`.
- Return `Resting / Out` player to queue.
- Rename/delete registered players.

MVP does not include:

- Editing completed game history.
- Multi-level undo.
- Duplicate-player merging.

### Manual Court Removal

When manually removing a player from court:

- Their `consecutiveWins` resets to 0.
- The court slot becomes empty.
- The app does not auto-fill immediately.

Available actions:

| Action | Behavior |
|---|---|
| Move to Queue | Player goes to the top/front of the queue |
| Rest / Out | Player goes to `Resting / Out` |

Example:

```txt
Court:
A B C D E

Queue:
F G H I
```

Manual remove `C` to queue:

```txt
Court:
A B _ D E

Queue:
C F G H I
```

## Queue Editing

Queue editing should use explicit button controls first.

Minimum queue actions:

- Move Up
- Move Down
- Move to Top
- Rest / Out

Drag-and-drop may be added later, but it should not be required for MVP.

## Undo

MVP supports a one-step `Undo Last Result`.

Rules:

- Undo only applies to winner actions.
- Undo does not apply to `Fill Empty Slots`.
- Undo does not apply to manual edits.
- Undo does not apply to check-in, rest/out, rename, or delete.
- Before `Team A Won` or `Team B Won`, save a previous state snapshot.
- Undo restores that previous snapshot.

## Persistence

Use `localStorage`.

Persist:

- Registered players.
- Active game-day session.
- Queue.
- Court.
- Resting / Out.
- Checked-in status/order.
- Consecutive-win counts.
- Last undo snapshot.

Behavior:

- Refresh restores the exact previous state.
- Reopening the GitHub Pages URL restores the previous state.
- `Start New Game Day` clears session state but keeps registered players.

## UI Requirements From Product Decisions

The UI must make these visible:

- Court teams and empty slots.
- Queue order.
- Resting / Out list.
- Registered-player status.
- Player consecutive-win count as `0W`, `1W`, or `2W`.
- Disabled winner buttons when both teams are not full.
- Disabled fill button when queue is empty.

Keep streak display simple:

```txt
Ivan  1W
Mark  0W
Josh  2W
```
