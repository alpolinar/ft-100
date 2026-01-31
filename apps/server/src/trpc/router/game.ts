import { EventEmitter } from "node:events";
import { TRPCError } from "@trpc/server";
import { pipe } from "remeda";
import z from "zod";
import {
  type GameEvent,
  type Game,
  type GameSlim,
  type LobbyType,
  type MoveCommand,
  type PlayerId,
  PlayerIdSchema,
  type TurnType,
} from "../../entities/game";
import { arrayElement } from "../../utils";
import { createAsyncQueue } from "../async-queue-helper";
import { protectedProcedure, router } from "../trpc";

const games = new Map<string, Game>();

const gameEvents = new EventEmitter();

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
    winner: isWinningMove ? cmd.playerId : undefined,
    currentTurn: isWinningMove
      ? state.currentTurn
      : state.currentTurn === "p1"
        ? "p2"
        : "p1",
    version: state.version + 1,
    updatedAt: new Date(),
  };
}

function startCoutdown(game: Game, duration = 5) {
  if (game.status !== "lobby" && game.status === "countdown") return;

  games.set(game.id, { ...game, countdown: duration });

  const interval = setInterval(() => {
    const currentGame = games.get(game.id);

    if (!currentGame) {
      clearInterval(interval);
      return;
    }

    const { countdown } = currentGame;

    if (countdown && countdown > 0) {
      const newState: Game = {
        ...currentGame,
        status: "countdown",
      };

      emitGameUpdate({
        gameId: game.id,
        payload: newState,
      });

      games.set(currentGame.id, {
        ...newState,
        countdown: countdown - 1,
      });
    } else {
      clearInterval(interval);

      const newState: Game = { ...currentGame, status: "active" };

      games.set(currentGame.id, newState);

      emitGameUpdate({
        gameId: currentGame.id,
        payload: newState,
      });
    }
  }, 1000);
}

function emitGameUpdate({
  gameId,
  payload,
}: Readonly<{ gameId: string; payload: Game }>): boolean {
  return gameEvents.emit<GameEvent>(`game:${gameId}`, {
    kind: "game_event",
    payload: convertGameStateToSlim(payload),
  });
}

function findGameOrThrow(gameId: string): Game {
  const game = games.get(gameId);

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
    winner: state.winner,
  };
}

const gameRouter = router({
  getGameState: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ input }): GameSlim => {
      const gameState = findGameOrThrow(input.gameId);

      return pipe(gameState, convertGameStateToSlim);
    }),
  createGame: protectedProcedure
    .input(
      z.object({
        lobbyType: z.enum<LobbyType[]>(["open", "invite"]),
        invitedPlayerId: PlayerIdSchema,
      })
    )
    .mutation(({ input, ctx }): GameSlim => {
      const currentPlayer = toPlayerId(ctx.user.id);
      const now = new Date();

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

      games.set(newGame.id, newGame);

      return pipe(newGame, convertGameStateToSlim);
    }),
  joinGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(({ input, ctx }) => {
      const currentPlayer = toPlayerId(ctx.user.id);
      const gameState = findGameOrThrow(input.gameId);

      const { p1, p2 } = gameState.players;

      if (p1 === currentPlayer || p2 === currentPlayer) {
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

      games.set(input.gameId, newState);

      if (
        newState.players.p1 &&
        newState.players.p2 &&
        newState.status === "lobby"
      ) {
        startCoutdown(newState);
      }

      emitGameUpdate({
        gameId: input.gameId,
        payload: newState,
      });

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
    .mutation(({ input, ctx }): GameSlim => {
      const playerId = toPlayerId(ctx.user.id);
      const gameState = findGameOrThrow(input.gameId);

      const newState = applyMove(gameState, {
        gameId: input.gameId,
        value: input.value,
        playerId,
      });

      games.set(newState.id, newState);

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
      signal,
    }): AsyncGenerator<GameEvent, void, unknown> {
      const game = games.get(input.gameId);
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

        yield await queue.next();
      } finally {
        gameEvents.off(key, handler);
      }
    }),
});

export { gameRouter };
