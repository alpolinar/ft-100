import { router } from "../../trpc.js";
import { cancelMatch } from "./cancel-match.js";
import { createGame } from "./create-game.js";
import { findMatch } from "./find-match.js";
import { getGameState } from "./get-game-state.js";
import { getMoveHistory } from "./get-move-history.js";
import { joinGame } from "./join-game.js";
import { makeMove } from "./make-move.js";
import { onGameUpdate } from "./on-game-update.js";
import { onMatchFound } from "./on-match-found.js";
import { surrenderGame } from "./surrender-game.js";

export const gameRouter = router({
  getGameState,
  getMoveHistory,
  createGame,
  joinGame,
  makeMove,
  onGameUpdate,
  findMatch,
  cancelMatch,
  onMatchFound,
  surrenderGame,
});
