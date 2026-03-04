import { EventEmitter } from "node:events";
import { TRPCError } from "@trpc/server";
import { pipe } from "remeda";
import z from "zod";
import {
  type Game,
  type GameEvent,
  type GameSlim,
  type LobbyType,
  type MoveCommand,
  type PlayerId,
  PlayerIdSchema,
  type TurnType,
} from "../../domain/entities/game/game.js";
import type { GameStore } from "../../infrastructure/persistence/game-store.js";
import { getLogger } from "../../infrastructure/logging/index.js";
import { arrayElement } from "../../utils/index.js";
import { createAsyncQueue } from "../async-queue-helper.js";
import { protectedProcedure, router } from "../trpc.js";

const gameEvents = new EventEmitter();
const logger = getLogger();

function toPlayerId(value: string): PlayerId {
  return value as PlayerId;
}

function isPlayersTurn(state: Game, playerId: PlayerId): boolean {
  if (state.status !== "active") {
    return false;
  }

  if (!Object.values(state.players).includes(playerId)) {
    return false;
  }

  return state.players[state.currentTurn] === playerId;
}

function applyMove(state: Game, cmd: MoveCommand): Game {
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

function startCountdown(gameStore: GameStore, game: Game, duration = 5) {
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

function emitGameUpdate({
  gameId,
  payload,
}: Readonly<{ gameId: string; payload: Game }>): boolean {
  logger.info("Emitting Game State Update");

  return gameEvents.emit<GameEvent>(`game:${gameId}`, {
    kind: "game_event",
    payload: convertGameStateToSlim(payload),
  });
}

async function findGameOrThrow(
  gameStore: GameStore,
  gameId: string
): Promise<Game> {
  const game = await gameStore.get(gameId);

  if (!game) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Game Not Found!" });
  }

  return game;
}

function convertGameStateToSlim(state: Game): GameSlim {
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

const gameRouter = router({
  getGameState: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input, ctx }): Promise<GameSlim> => {
      const gameState = await findGameOrThrow(ctx.gameStore, input.gameId);

      return pipe(gameState, convertGameStateToSlim);
    }),
  createGame: protectedProcedure
    .input(
      z.object({
        lobbyType: z.enum<LobbyType[]>(["open", "invite"]),
        invitedPlayerId: PlayerIdSchema,
      })
    )
    .mutation(async ({ input, ctx }): Promise<GameSlim> => {
      const currentPlayer = toPlayerId(ctx.user.id);
      const now = new Date();

      logger.info({ userId: currentPlayer }, "Creating Game...");

      const newGame: Game = {
        id: crypto.randomUUID(),
        createdBy: currentPlayer,
        lobbyType: input.lobbyType,
        invitedPlayerId: input.invitedPlayerId,
        currentTurn: arrayElement<TurnType>(["p1", "p2"]) ?? "p1",
        players: {
          p1: currentPlayer,
        },
        globalValue: 0,
        status: "lobby",
        createdAt: now,
        updatedAt: now,
        version: 1,
      };

      await ctx.gameStore.set(newGame);

      logger.info({ gameId: newGame.id }, "Game Successfully Created");

      return pipe(newGame, convertGameStateToSlim);
    }),
  joinGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const currentPlayer = toPlayerId(ctx.user.id);
      const gameState = await findGameOrThrow(ctx.gameStore, input.gameId);

      logger.info(
        { gameId: input.gameId, userId: currentPlayer },
        "Player is joining game"
      );

      const { p1, p2 } = gameState.players;

      if (p1 === currentPlayer || p2 === currentPlayer) {
        logger.info(
          { gameId: input.gameId, userId: currentPlayer },
          "Player already joined"
        );

        return {
          status: true,
          message: "Player already joined",
        };
      }

      if (p1 && p2) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Lobby full." });
      }

      const newState: Game = {
        ...gameState,
        players: {
          p1: gameState.players.p1,
          p2: p2 ?? currentPlayer,
        },
      };

      await ctx.gameStore.set(newState);

      if (
        newState.players.p1 &&
        newState.players.p2 &&
        newState.status === "lobby"
      ) {
        startCountdown(ctx.gameStore, newState);
      }

      emitGameUpdate({
        gameId: input.gameId,
        payload: newState,
      });

      logger.info({ userId: ctx.user.id }, "Player has joined the game");

      return {
        status: true,
        message: "Game joined",
      };
    }),
  makeMove: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        value: z.number(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<GameSlim> => {
      logger.info(
        { gameId: input.gameId, userId: ctx.user.id },
        "Player is making a move"
      );

      const playerId = toPlayerId(ctx.user.id);
      const gameState = await findGameOrThrow(ctx.gameStore, input.gameId);

      const newState = applyMove(gameState, {
        gameId: input.gameId,
        value: input.value,
        playerId,
      });

      if (newState.status === "finished") {
        await ctx.prisma.game.create({
          data: {
            id: newState.id,
            createdBy: newState.createdBy,
            invitedPlayerId: newState.invitedPlayerId ?? null,
            players: newState.players as Record<string, string>,
            lobbyType: newState.lobbyType,
            currentTurn: newState.currentTurn,
            globalValue: newState.globalValue,
            status: newState.status,
            winnerId: newState.winnerId ?? null,
            version: newState.version,
          },
        });
        await ctx.gameStore.delete(newState.id);
        logger.info({ gameId: newState.id }, "Finished game persisted to Postgres and removed from Redis");
      } else {
        await ctx.gameStore.set(newState);
      }

      emitGameUpdate({
        gameId: input.gameId,
        payload: newState,
      });

      return pipe(newState, convertGameStateToSlim);
    }),
  onGameUpdate: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .subscription(async function* ({
      input,
      ctx,
      signal,
    }): AsyncGenerator<GameEvent, void, unknown> {
      const game = await ctx.gameStore.get(input.gameId);
      const key = `game:${input.gameId}`;

      const queue = createAsyncQueue<GameEvent>();
      const handler = (event: GameEvent) => queue.push(event);

      if (game) {
        queue.push({
          kind: "game_event",
          payload: pipe(game, convertGameStateToSlim),
        });
      }

      gameEvents.on(key, handler);

      try {
        while (!signal?.aborted) {
          yield await queue.next();
        }
      } finally {
        gameEvents.off(key, handler);
      }
    }),
});

export { gameRouter };
