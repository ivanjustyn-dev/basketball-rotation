import type {
  AppSessionState,
  AppState,
  CourtState,
  Player,
  PlayerId,
  PlayerStatus,
  TeamKey,
  WinCount,
} from "../types";

export const COURT_SIZE = 5;

export function emptyCourt(): CourtState {
  return {
    teamA: Array<PlayerId | null>(COURT_SIZE).fill(null),
    teamB: Array<PlayerId | null>(COURT_SIZE).fill(null),
  };
}

export function createInitialSession(): AppSessionState {
  return {
    queue: [],
    court: emptyCourt(),
    restingPlayers: [],
    checkedInPlayers: [],
    sessionPlayers: {},
  };
}

export function createInitialState(): AppState {
  return {
    registeredPlayers: [],
    undoSnapshot: null,
    ...createInitialSession(),
  };
}

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeNameKey(name: string) {
  return normalizeName(name).toLocaleLowerCase();
}

export function makePlayer(name: string, id = createId()): Player {
  return { id, name: normalizeName(name) };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneSession(state: AppSessionState): AppSessionState {
  return {
    queue: [...state.queue],
    court: {
      teamA: [...state.court.teamA],
      teamB: [...state.court.teamB],
    },
    restingPlayers: [...state.restingPlayers],
    checkedInPlayers: [...state.checkedInPlayers],
    sessionPlayers: Object.fromEntries(
      Object.entries(state.sessionPlayers).map(([id, value]) => [
        id,
        { ...value },
      ]),
    ),
  };
}

export function snapshotSession(state: AppSessionState): AppSessionState {
  return cloneSession(state);
}

export function parsePlayerNames(input: string) {
  return input
    .split(/\r?\n/)
    .map(normalizeName)
    .filter(Boolean);
}

export function addRegisteredPlayers(
  state: AppState,
  rawInput: string,
  makeId: () => string = createId,
) {
  const existing = new Set(
    state.registeredPlayers.map((player) => normalizeNameKey(player.name)),
  );
  const seenInInput = new Set<string>();
  const added: Player[] = [];
  const duplicates: string[] = [];

  for (const name of parsePlayerNames(rawInput)) {
    const key = normalizeNameKey(name);
    if (existing.has(key) || seenInInput.has(key)) {
      duplicates.push(name);
      continue;
    }

    seenInInput.add(key);
    added.push(makePlayer(name, makeId()));
  }

  return {
    state: {
      ...state,
      registeredPlayers: [...state.registeredPlayers, ...added],
    },
    added,
    duplicates,
  };
}

export function renameRegisteredPlayer(
  state: AppState,
  playerId: PlayerId,
  nextName: string,
) {
  const name = normalizeName(nextName);
  if (!name) {
    return { state, ok: false, reason: "empty" as const };
  }

  const duplicate = state.registeredPlayers.some(
    (player) =>
      player.id !== playerId &&
      normalizeNameKey(player.name) === normalizeNameKey(name),
  );

  if (duplicate) {
    return { state, ok: false, reason: "duplicate" as const };
  }

  return {
    state: {
      ...state,
      registeredPlayers: state.registeredPlayers.map((player) =>
        player.id === playerId ? { ...player, name } : player,
      ),
    },
    ok: true,
    reason: null,
  };
}

export function deleteRegisteredPlayer(state: AppState, playerId: PlayerId) {
  const nextCourt = removeFromCourt(state.court, playerId).court;
  const { [playerId]: _deleted, ...sessionPlayers } = state.sessionPlayers;

  return {
    ...state,
    registeredPlayers: state.registeredPlayers.filter(
      (player) => player.id !== playerId,
    ),
    queue: state.queue.filter((id) => id !== playerId),
    court: nextCourt,
    restingPlayers: state.restingPlayers.filter((id) => id !== playerId),
    checkedInPlayers: state.checkedInPlayers.filter((id) => id !== playerId),
    sessionPlayers,
    undoSnapshot: state.undoSnapshot
      ? deleteFromSnapshot(state.undoSnapshot, playerId)
      : null,
  };
}

function deleteFromSnapshot(snapshot: AppSessionState, playerId: PlayerId) {
  const { [playerId]: _deleted, ...sessionPlayers } = snapshot.sessionPlayers;
  return {
    ...snapshot,
    queue: snapshot.queue.filter((id) => id !== playerId),
    court: removeFromCourt(snapshot.court, playerId).court,
    restingPlayers: snapshot.restingPlayers.filter((id) => id !== playerId),
    checkedInPlayers: snapshot.checkedInPlayers.filter((id) => id !== playerId),
    sessionPlayers,
  };
}

export function startNewGameDay(state: AppState): AppState {
  return {
    ...state,
    ...createInitialSession(),
    undoSnapshot: null,
  };
}

export function checkInPlayer(state: AppState, playerId: PlayerId): AppState {
  if (!state.registeredPlayers.some((player) => player.id === playerId)) {
    return state;
  }

  if (isPlayerActive(state, playerId)) {
    return state;
  }

  const returningFromRest = state.restingPlayers.includes(playerId);

  return {
    ...state,
    queue: state.queue.includes(playerId) ? state.queue : [...state.queue, playerId],
    restingPlayers: state.restingPlayers.filter((id) => id !== playerId),
    checkedInPlayers:
      state.checkedInPlayers.includes(playerId) || returningFromRest
        ? state.checkedInPlayers
        : [...state.checkedInPlayers, playerId],
    sessionPlayers: ensureSessionPlayer(state.sessionPlayers, playerId),
  };
}

export function checkInAllPlayers(state: AppState): AppState {
  return state.registeredPlayers.reduce(
    (nextState, player) => checkInPlayer(nextState, player.id),
    state,
  );
}

export function fillEmptySlots(state: AppState): AppState {
  if (state.queue.length === 0) {
    return state;
  }

  const queue = [...state.queue];
  const court = {
    teamA: [...state.court.teamA],
    teamB: [...state.court.teamB],
  };

  for (const team of ["teamA", "teamB"] as TeamKey[]) {
    for (let index = 0; index < COURT_SIZE; index += 1) {
      if (court[team][index] === null && queue.length > 0) {
        court[team][index] = queue.shift() ?? null;
      }
    }
  }

  return { ...state, queue, court };
}

export function recordWinner(state: AppState, winningTeam: TeamKey): AppState {
  if (!isCourtFull(state.court)) {
    return state;
  }

  const losingTeam: TeamKey = winningTeam === "teamA" ? "teamB" : "teamA";
  const winners = state.court[winningTeam].filter(Boolean) as PlayerId[];
  const losers = state.court[losingTeam].filter(Boolean) as PlayerId[];
  const court = {
    teamA: [...state.court.teamA],
    teamB: [...state.court.teamB],
  };
  const sessionPlayers = { ...state.sessionPlayers };
  const rotatingWinners: PlayerId[] = [];

  for (let index = 0; index < court[winningTeam].length; index += 1) {
    const playerId = court[winningTeam][index];
    if (!playerId) continue;

    const nextWins = Math.min(
      ((sessionPlayers[playerId]?.consecutiveWins ?? 0) + 1) as WinCount,
      2,
    ) as WinCount;

    if (nextWins >= 2) {
      rotatingWinners.push(playerId);
      court[winningTeam][index] = null;
      sessionPlayers[playerId] = { consecutiveWins: 0 };
    } else {
      sessionPlayers[playerId] = { consecutiveWins: nextWins };
    }
  }

  for (let index = 0; index < court[losingTeam].length; index += 1) {
    const playerId = court[losingTeam][index];
    if (!playerId) continue;

    court[losingTeam][index] = null;
    sessionPlayers[playerId] = { consecutiveWins: 0 };
  }

  return {
    ...state,
    court,
    sessionPlayers,
    queue: [...state.queue, ...rotatingWinners, ...losers],
    undoSnapshot: snapshotSession(state),
  };
}

export function undoLastResult(state: AppState): AppState {
  if (!state.undoSnapshot) {
    return state;
  }

  return {
    ...state,
    ...snapshotSession(state.undoSnapshot),
    undoSnapshot: null,
  };
}

export function moveQueuePlayer(state: AppState, playerId: PlayerId, direction: -1 | 1) {
  const index = state.queue.indexOf(playerId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= state.queue.length) {
    return state;
  }

  const queue = [...state.queue];
  [queue[index], queue[nextIndex]] = [queue[nextIndex], queue[index]];
  return { ...state, queue };
}

export function moveQueuePlayerToTop(state: AppState, playerId: PlayerId) {
  if (!state.queue.includes(playerId)) {
    return state;
  }

  return {
    ...state,
    queue: [playerId, ...state.queue.filter((id) => id !== playerId)],
  };
}

export function moveQueuePlayerToRest(state: AppState, playerId: PlayerId) {
  if (!state.queue.includes(playerId)) {
    return state;
  }

  return movePlayerToRest({
    ...state,
    queue: state.queue.filter((id) => id !== playerId),
  }, playerId);
}

export function moveCourtPlayerToQueue(
  state: AppState,
  team: TeamKey,
  slotIndex: number,
) {
  const playerId = state.court[team][slotIndex];
  if (!playerId) {
    return state;
  }

  const court = {
    teamA: [...state.court.teamA],
    teamB: [...state.court.teamB],
  };
  court[team][slotIndex] = null;

  return {
    ...state,
    court,
    queue: [playerId, ...state.queue.filter((id) => id !== playerId)],
    sessionPlayers: resetWins(state.sessionPlayers, playerId),
  };
}

export function moveCourtPlayerToRest(
  state: AppState,
  team: TeamKey,
  slotIndex: number,
) {
  const playerId = state.court[team][slotIndex];
  if (!playerId) {
    return state;
  }

  const court = {
    teamA: [...state.court.teamA],
    teamB: [...state.court.teamB],
  };
  court[team][slotIndex] = null;

  return movePlayerToRest({ ...state, court }, playerId);
}

export function swapCourtPlayers(
  state: AppState,
  sourceTeam: TeamKey,
  sourceSlotIndex: number,
  targetTeam: TeamKey,
  targetSlotIndex: number,
) {
  if (sourceTeam === targetTeam && sourceSlotIndex === targetSlotIndex) {
    return state;
  }

  const sourcePlayerId = state.court[sourceTeam][sourceSlotIndex];
  const targetPlayerId = state.court[targetTeam][targetSlotIndex];
  if (!sourcePlayerId || !targetPlayerId) {
    return state;
  }

  const court = {
    teamA: [...state.court.teamA],
    teamB: [...state.court.teamB],
  };

  court[sourceTeam][sourceSlotIndex] = targetPlayerId;
  court[targetTeam][targetSlotIndex] = sourcePlayerId;

  return { ...state, court };
}

export function returnRestingPlayerToQueue(state: AppState, playerId: PlayerId) {
  if (!state.restingPlayers.includes(playerId)) {
    return state;
  }

  return {
    ...state,
    restingPlayers: state.restingPlayers.filter((id) => id !== playerId),
    queue: state.queue.includes(playerId) ? state.queue : [...state.queue, playerId],
  };
}

function movePlayerToRest(state: AppState, playerId: PlayerId): AppState {
  return {
    ...state,
    restingPlayers: state.restingPlayers.includes(playerId)
      ? state.restingPlayers
      : [...state.restingPlayers, playerId],
    queue: state.queue.filter((id) => id !== playerId),
    sessionPlayers: resetWins(state.sessionPlayers, playerId),
  };
}

function resetWins(
  sessionPlayers: AppState["sessionPlayers"],
  playerId: PlayerId,
): AppState["sessionPlayers"] {
  return {
    ...sessionPlayers,
    [playerId]: { consecutiveWins: 0 as WinCount },
  };
}

function ensureSessionPlayer(
  sessionPlayers: AppState["sessionPlayers"],
  playerId: PlayerId,
): AppState["sessionPlayers"] {
  if (sessionPlayers[playerId]) {
    return sessionPlayers;
  }

  return {
    ...sessionPlayers,
    [playerId]: { consecutiveWins: 0 as WinCount },
  };
}

function removeFromCourt(court: CourtState, playerId: PlayerId) {
  return {
    court: {
      teamA: court.teamA.map((id) => (id === playerId ? null : id)),
      teamB: court.teamB.map((id) => (id === playerId ? null : id)),
    },
  };
}

export function isCourtFull(court: CourtState) {
  return (
    court.teamA.every(Boolean) &&
    court.teamB.every(Boolean) &&
    court.teamA.length === COURT_SIZE &&
    court.teamB.length === COURT_SIZE
  );
}

export function getPlayerStatus(state: AppState, playerId: PlayerId): PlayerStatus {
  const queueIndex = state.queue.indexOf(playerId);
  if (queueIndex >= 0) {
    return { label: `Queue #${queueIndex + 1}`, type: "queue" };
  }

  if (state.court.teamA.includes(playerId)) {
    return { label: "On Court - Team A", type: "court" };
  }

  if (state.court.teamB.includes(playerId)) {
    return { label: "On Court - Team B", type: "court" };
  }

  if (state.restingPlayers.includes(playerId)) {
    return { label: "Resting / Out", type: "resting" };
  }

  return { label: "Not Checked In", type: "not-checked-in" };
}

export function getPlayerName(players: Player[], playerId: PlayerId) {
  return players.find((player) => player.id === playerId)?.name ?? "Unknown";
}

export function getWins(state: AppState, playerId: PlayerId) {
  return state.sessionPlayers[playerId]?.consecutiveWins ?? 0;
}

function isPlayerActive(state: AppState, playerId: PlayerId) {
  return (
    state.queue.includes(playerId) ||
    state.court.teamA.includes(playerId) ||
    state.court.teamB.includes(playerId)
  );
}
