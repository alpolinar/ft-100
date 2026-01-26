import { isEmpty } from "moderndash";
import { EventEmitter } from "node:events";
import z from "zod";
import { createAsyncQueue } from "../async-queue-helper";
import { protectedProcedure, router } from "../trpc";

const PlayerIdSchema = z.string().brand<"PlayerId">();

type PlayerId = z.infer<typeof PlayerIdSchema>;

type Players = Readonly<{
  p1: PlayerId;
  p2?: PlayerId;
}>;

type GameState = Readonly<{
  id: string;
  createdBy: PlayerId;
  invitedPlayerId?: PlayerId;
  players: Players;
  lobbyType: "open" | "invite";
  currentTurn: "p1" | "p2";
  globalValue: number;
  status: "lobby" | "active" | "finished";
  winner?: PlayerId;
  version: number; // optimistic locking
  createdAt: Date;
  updatedAt: Date;
}>;

type GameStateSlim = Omit<
  GameState,
  | "createdBy"
  | "version"
  | "createdAt"
  | "updatedAt"
  | "currentTurn"
  | "lobbyType"
>;

type MoveCommand = {
  gameId: string;
  playerId: PlayerId;
  value: number; // 1–10
};

type GameEvent = {
  kind: "game_event";
  payload:
    | { type: "state_updated"; state: GameStateSlim }
    | { type: "game_finished"; winner: PlayerId };
};

const games = new Map<string, GameState>();

const gameEvents = new EventEmitter();

function toPlayerId(value: string): PlayerId {
  return value as PlayerId;
}

function isPlayersTurn(state: GameState, playerId: PlayerId): boolean {
  if (state.status !== "active") return false;

  if (!Object.values(state.players).includes(playerId)) return false;

  return state.players[state.currentTurn] === playerId;
}

function applyMove(state: GameState, cmd: MoveCommand): GameState {
  if (state.status !== "active") {
    throw new Error("Game not active");
  }

  if (!isPlayersTurn(state, cmd.playerId)) {
    throw new Error("Not your turn");
  }

  if (cmd.value < 1 || cmd.value > 10) {
    throw new Error("Invalid move");
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

function isLobbyFull(players: Players): boolean {
  return !isEmpty(players.p1) && !isEmpty(players.p2);
}

function emitGameUpdate({
  gameId,
  data,
}: Readonly<{ gameId: string; data: GameStateSlim }>) {
  gameEvents.emit<GameEvent>(`game:${gameId}`, {
    kind: "game_event",
    payload: {
      type: "state_updated",
      state: {
        id: data.id,
        globalValue: data.globalValue,
        players: data.players,
        status: data.status,
        winner: data.winner,
      },
    },
  });
}

const gameRouter = router({
  getGameState: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ input }): GameStateSlim => {
      const gameState = games.get(input.gameId);

      if (!gameState) {
        throw new Error("No Game State Found");
      }

      return {
        id: gameState.id,
        globalValue: gameState.globalValue,
        players: gameState.players,
        status: gameState.status,
        winner: gameState.winner,
      };
    }),
  createGame: protectedProcedure
    .input(
      z.object({
        lobbyType: z.enum(["open", "invite"]),
        invitedPlayerId: PlayerIdSchema,
      })
    )
    .mutation(({ input, ctx }): GameStateSlim => {
      const currentPlayer = toPlayerId(ctx.user.id);

      const newGame: GameState = {
        id: crypto.randomUUID(),
        createdBy: currentPlayer,
        lobbyType: input.lobbyType,
        invitedPlayerId: input.invitedPlayerId,
        currentTurn: "p1",
        players: {
          p1: currentPlayer,
        },
        globalValue: 0,
        status: "lobby",
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      games.set(newGame.id, newGame);

      return {
        id: newGame.id,
        globalValue: newGame.globalValue,
        players: newGame.players,
        status: newGame.status,
        winner: newGame.winner,
      };
    }),
  joinGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(({ input, ctx }) => {
      const currentPlayer = toPlayerId(ctx.user.id);
      const gameState = games.get(input.gameId);

      if (!gameState) {
        return {
          status: false,
          message: "No game found",
        };
      }

      const { lobbyType, invitedPlayerId } = gameState;

      if (isLobbyFull(gameState.players)) {
        throw new Error("Lobby full");
      }

      if (lobbyType === "invite" && invitedPlayerId !== currentPlayer) {
        throw new Error("Cannot join game.");
      }

      const newState: GameState = {
        ...gameState,
        players: {
          p1:
            gameState.players.p1 === currentPlayer
              ? currentPlayer
              : gameState.players.p1,
          p2: toPlayerId(ctx.user.id),
        },
        status: "active",
      };

      games.set(input.gameId, newState);

      emitGameUpdate({
        gameId: input.gameId,
        data: {
          id: newState.id,
          globalValue: newState.globalValue,
          players: newState.players,
          status: newState.status,
          winner: newState.winner,
        },
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
    .mutation(({ input, ctx }): GameStateSlim => {
      const playerId = toPlayerId(ctx.user.id);
      const gameState = games.get(input.gameId);

      if (!gameState) {
        throw new Error("Game does not exists");
      }

      const newState = applyMove(gameState, {
        gameId: input.gameId,
        value: input.value,
        playerId,
      });

      games.set(newState.id, newState);

      emitGameUpdate({
        gameId: input.gameId,
        data: {
          id: newState.id,
          globalValue: newState.globalValue,
          players: newState.players,
          status: newState.status,
          winner: newState.winner,
        },
      });

      return {
        id: newState.id,
        globalValue: newState.globalValue,
        players: newState.players,
        status: newState.status,
        winner: newState.winner,
      };
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
          payload: {
            type: "state_updated",
            state: structuredClone({
              id: game.id,
              globalValue: game.globalValue,
              players: game.players,
              status: game.status,
              winner: game.winner,
            }),
          },
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
