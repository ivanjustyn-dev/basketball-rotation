export type PlayerId = string;
export type TeamKey = "teamA" | "teamB";
export type WinCount = 0 | 1 | 2;

export type Player = {
  id: PlayerId;
  name: string;
};

export type SessionPlayer = {
  consecutiveWins: WinCount;
};

export type CourtState = {
  teamA: Array<PlayerId | null>;
  teamB: Array<PlayerId | null>;
};

export type AppSessionState = {
  queue: PlayerId[];
  court: CourtState;
  restingPlayers: PlayerId[];
  checkedInPlayers: PlayerId[];
  sessionPlayers: Record<PlayerId, SessionPlayer>;
};

export type AppState = AppSessionState & {
  registeredPlayers: Player[];
  undoSnapshot: AppSessionState | null;
};

export type PlayerStatus =
  | { label: "Not Checked In"; type: "not-checked-in" }
  | { label: `Queue #${number}`; type: "queue" }
  | { label: "On Court - Team A"; type: "court" }
  | { label: "On Court - Team B"; type: "court" }
  | { label: "Resting / Out"; type: "resting" };
