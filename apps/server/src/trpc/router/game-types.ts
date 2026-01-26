import z from "zod";

export const PlayerIdSchema = z.string().brand<"PlayerId">();

export type PlayerId = z.infer<typeof PlayerIdSchema>;

export type Players = Readonly<{
  p1: PlayerId;
  p2?: PlayerId;
}>;

export type GameStateStatus = "lobby" | "countdown" | "active" | "finished";

export type LobbyType = "open" | "invite";

export type TurnType = "p1" | "p2";

export type GameState = Readonly<{
  id: string;
  createdBy: PlayerId;
  invitedPlayerId?: PlayerId;
  players: Players;
  lobbyType: LobbyType;
  currentTurn: TurnType;
  globalValue: number;
  status: GameStateStatus;
  winner?: PlayerId;
  countdown?: number;
  version: number; // optimistic locking
  createdAt: Date;
  updatedAt: Date;
}>;

export type GameStateSlim = Omit<
  GameState,
  "createdBy" | "version" | "createdAt" | "updatedAt" | "lobbyType"
>;

export type MoveCommand = {
  gameId: string;
  playerId: PlayerId;
  value: number; // 1–10
};

export type GameEventPayload =
  | { type: "state_updated"; state: GameStateSlim }
  | { type: "game_finished"; winner: PlayerId };

export type GameEvent = {
  kind: "game_event";
  payload: GameEventPayload;
};
