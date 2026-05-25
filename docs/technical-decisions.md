# Basketball Rotation App — Technical Decisions

## Goals

This document defines the recommended technical architecture for the MVP.

Primary goals:

- Extremely simple deployment.
- Mobile-first UI.
- Fast local interaction during live basketball games.
- Zero backend.
- GitHub Pages compatible.
- Easy maintenance.
- Easy future expansion.

---

# Recommended Stack

## Frontend Framework

Recommendation:

- React
- TypeScript
- Vite

Reasoning:

| Choice | Reason |
|---|---|
| React | Fastest ecosystem for UI/state iteration |
| TypeScript | Safer state management for rotation logic |
| Vite | Very fast dev/build setup and GitHub Pages friendly |

Recommended versions:

```txt
React 19+
TypeScript 5+
Vite 7+
```

---

# Deployment

## Platform

Deploy to:

entity["company","GitHub","GitHub platform"] Pages

Recommended setup:

- Static SPA.
- No SSR.
- No backend.
- No API server.
- Build output deployed from GitHub Actions.

Reasoning:

- Free hosting.
- Extremely simple deployment.
- Perfect fit for localStorage-only MVP.
- No infra maintenance.

---

# State Management

## Recommendation

Use:

- Zustand

Reasoning:

| Option | Decision |
|---|---|
| Redux Toolkit | Too heavy for MVP |
| Context-only | Becomes messy for rotation logic |
| Zustand | Simple, lightweight, excellent for local-first state |

Recommended structure:

```txt
src/store
  useAppStore.ts
```

State should contain:

```ts
registeredPlayers
queue
court
restingPlayers
checkedInPlayers
undoSnapshot
sessionMetadata
```

---

# Persistence

## Recommendation

Use:

```txt
localStorage
```

through:

```txt
zustand persist middleware
```

Reasoning:

- Very little code.
- Automatic persistence.
- Easy recovery after refresh.
- Perfect for frontend-only app.

Recommended storage key:

```txt
basketball-rotation-app
```

---

# UI Library

## Recommendation

Use:

- shadcn/ui
- Tailwind CSS

Reasoning:

| Library | Reason |
|---|---|
| shadcn/ui | Simple primitives, easy customization |
| Tailwind | Fast mobile-first layout iteration |

Do NOT use:

- Material UI
- Ant Design
- Chakra-heavy styling systems

Reason:

They are visually too enterprise-heavy for this app.

The target UX should feel:

- lightweight
- fast
- touch-friendly
- easy to scan during live games

---

# Design Philosophy

## Visual Direction

Use:

- neutral/basic colors
- minimal borders
- large touch targets
- very little visual noise
- card-based layout
- obvious hierarchy

Avoid:

- gradients
- glassmorphism
- flashy animations
- dense tables
- excessive icons
- sports-themed visual clutter

Recommended palette:

```txt
White background
Neutral grays
Dark text
Single accent color:
- blue
OR
- green
```

Recommended spacing:

```txt
Large padding
Large buttons
Large row heights
```

The app should prioritize:

```txt
speed of understanding
speed of tapping
```

not visual complexity.

---

# Mobile-First Layout

## Recommended Page Layout

```txt
Header

Primary Actions
- Fill Empty Slots
- Team A Won
- Team B Won
- Undo Last Result

Court
- Team A Card
- Team B Card

Queue

Resting / Out

Registered Players
```

Recommended behavior:

- Single-page app.
- Vertical scroll.
- No route complexity required for MVP.
- No nested navigation.

---

# Court UI Recommendation

## Team Cards

Each team should appear as a separate card.

Example:

```txt
┌──────────────┐
│ Team A       │
│              │
│ Ivan   1W    │
│ Mark   0W    │
│ Josh   1W    │
│ Carlo  0W    │
│ Luis   0W    │
│              │
│ [Team A Won] │
└──────────────┘
```

Recommended interactions:

- Tap player row.
- Open bottom sheet or action menu.

Actions:

```txt
Move to Queue
Rest / Out
Swap Player
```

---

# Queue UI Recommendation

## Queue List

Use a simple vertical list.

Example:

```txt
1. Paolo   0W
   [↑] [↓] [Top] [Rest]

2. Ken     1W
   [↑] [↓] [Top] [Rest]
```

Recommendation:

- Use buttons first.
- Drag-and-drop optional later.

Reason:

Touch drag interactions are error-prone during live games.

---

# Registered Players UI

## Recommendation

Use searchable card/list rows.

Example:

```txt
Ivan
On Court - Team A

Mark
Queue #2

Josh
Resting / Out
[Check In]
```

Required actions:

```txt
Check In
Rename
Delete
```

Registration flow:

```txt
Floating Action Button
OR
Top Add Player button
```

opens:

```txt
Textarea modal
```

---

# Modal / Overlay Recommendation

Use:

- bottom sheets on mobile
- dialogs on desktop

Recommended library:

```txt
shadcn drawer/dialog
```

Reason:

Bottom sheets are easier during one-handed mobile usage.

---

# Animation Recommendation

Minimal animation only.

Allowed:

- subtle button transitions
- drawer animations
- toast fade-in

Avoid:

- animated court movement
- fancy drag visuals
- physics animations

Reason:

The app is a utility tool, not a social/spectator app.

---

# Icons

Recommendation:

- lucide-react

Use sparingly.

Examples:

```txt
Plus
ArrowUp
ArrowDown
RotateCcw
```

Do not overload the UI with icons.

---

# Notifications

Use lightweight toast notifications.

Recommended library:

```txt
sonner
```

Examples:

```txt
Team A recorded as winner
Undo?
```

```txt
No players in queue
```

---

# Testing Recommendation

## MVP Level

Use:

- Vitest
- React Testing Library

Focus tests on:

- queue mutations
- winner logic
- streak logic
- fill-empty-slots behavior
- undo logic

Do not overinvest in UI snapshot testing.

---

# Suggested Project Structure

```txt
src/
  components/
    court/
    queue/
    players/
    ui/

  store/
    useAppStore.ts

  lib/
    rotation/
    persistence/
    utils/

  types/

  hooks/

  pages/

  styles/
```

---

# Recommended Core Data Shapes

```ts
Player {
  id: string
  name: string
}
```

```ts
SessionPlayer {
  playerId: string
  consecutiveWins: number
}
```

```ts
CourtState {
  teamA: (string | null)[]
  teamB: (string | null)[]
}
```

---

# Recommended Future Expansion Paths

Possible future additions:

- game history
- statistics
- player rankings
- multiple courts
- live sync
- QR join system
- PWA/offline install
- Firebase sync
- TV display mode

The MVP architecture should remain simple enough that these can be layered later without early overengineering.
