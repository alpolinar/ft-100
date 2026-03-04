import { Game, PlayerId } from "./game.entity.js";

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
