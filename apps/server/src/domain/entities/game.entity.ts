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
  winnerId?: PlayerId;
  countdown?: number;
  version: number; // optimistic locking
  createdAt: Date;
  updatedAt: Date;
}>;
