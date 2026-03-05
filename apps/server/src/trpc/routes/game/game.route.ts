import { router } from "../../trpc.js";
import { createGame } from "./create-game.js";
import { getGameState } from "./get-game-state.js";
import { joinGame } from "./join-game.js";
import { makeMove } from "./make-move.js";
import { onGameUpdate } from "./on-game-update.js";

export const gameRouter = router({
  getGameState,
  createGame,
  joinGame,
  makeMove,
  onGameUpdate,
});
