import { TRPCError } from "@trpc/server";
import type { Game, PlayerId } from "../../../domain/entities/game.entity.js";
import type {
  GameEvent,
  GameSlim,
  MoveCommand,
} from "../../../domain/entities/game-event.entity.js";
import type { GameStore } from "../../../infrastructure/persistence/game.store.js";
import { gameEvents, logger } from "./shared.js";

export function toPlayerId(value: string): PlayerId {
  return value as PlayerId;
}

export function isPlayersTurn(state: Game, playerId: PlayerId): boolean {
  if (state.status !== "active") {
    return false;
  }

  if (!Object.values(state.players).includes(playerId)) {
    return false;
  }

  return state.players[state.currentTurn] === playerId;
}

export function applyMove(state: Game, cmd: MoveCommand): Game {
  if (state.status !== "active") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Game not active." });
  }

  if (!isPlayersTurn(state, cmd.playerId)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Not your turn." });
  }

  if (cmd.value < 1 || cmd.value > 10) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid move" });
  }

  const nextValue = state.globalValue + cmd.value;

  const isWinningMove = nextValue >= 100;

  return {
    ...state,
    globalValue: nextValue,
    status: isWinningMove ? "finished" : "active",
    winnerId: isWinningMove ? cmd.playerId : undefined,
    currentTurn: isWinningMove
      ? state.currentTurn
      : state.currentTurn === "p1"
        ? "p2"
        : "p1",
    version: state.version + 1,
    updatedAt: new Date(),
  };
}

export function startCountdown(gameStore: GameStore, game: Game, duration = 5) {
  logger.info({ id: game.id }, "Starting game countdown...");
  if (game.status !== "lobby" && game.status === "countdown") {
    logger.error(
      {
        id: game.id,
        status: game.status,
      },
      "Invalid game state"
    );
    return;
  }

  // Fire-and-forget the initial set, then start the interval
  void gameStore.set({ ...game, countdown: duration }).then(() => {
    const interval = setInterval(() => {
      void (async () => {
        const currentGame = await gameStore.get(game.id);

        if (!currentGame) {
          logger.error(game, "Failed to fetch game state");
          clearInterval(interval);
          return;
        }

        const { countdown } = currentGame;

        if (countdown && countdown > 0) {
          logger.info(`Game is starting in ${countdown}`);
          const newState: Game = {
            ...currentGame,
            status: "countdown",
          };

          emitGameUpdate({
            gameId: game.id,
            payload: newState,
          });

          await gameStore.set({
            ...newState,
            countdown: countdown - 1,
          });
        } else {
          clearInterval(interval);

          const newState: Game = { ...currentGame, status: "active" };

          await gameStore.set(newState);

          emitGameUpdate({
            gameId: currentGame.id,
            payload: newState,
          });

          logger.info("Game has started.");
        }
      })();
    }, 1000);
  });
}

export function emitGameUpdate({
  gameId,
  payload,
}: Readonly<{ gameId: string; payload: Game }>): boolean {
  logger.info("Emitting Game State Update");

  return gameEvents.emit<GameEvent>(`game:${gameId}`, {
    kind: "game_event",
    payload: convertGameStateToSlim(payload),
  });
}

export async function findGameOrThrow(
  gameStore: GameStore,
  gameId: string
): Promise<Game> {
  const game = await gameStore.get(gameId);

  if (!game) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Game Not Found!" });
  }

  return game;
}

export function convertGameStateToSlim(state: Game): GameSlim {
  return {
    id: state.id,
    players: state.players,
    status: state.status,
    countdown: state.countdown,
    currentTurn: state.currentTurn,
    globalValue: state.globalValue,
    invitedPlayerId: state.invitedPlayerId,
    winnerId: state.winnerId,
  };
}
