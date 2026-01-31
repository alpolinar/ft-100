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

export type Game = Readonly<{
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

export type GameSlim = Omit<
  Game,
  "createdBy" | "version" | "createdAt" | "updatedAt" | "lobbyType"
>;

export type MoveCommand = {
  gameId: string;
  playerId: PlayerId;
  value: number; // 1–10
};

export type GameEvent = {
  kind: "game_event";
  payload: GameSlim;
};
