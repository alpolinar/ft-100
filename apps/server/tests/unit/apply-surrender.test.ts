import { describe, expect, it } from "vitest";
import type {
  Game,
  PlayerId,
} from "../../src/domain/entities/game.entity.js";
import { applySurrender } from "../../src/trpc/routes/game/helpers.js";

function pid(id: string): PlayerId {
  return id as PlayerId;
}

function makeActiveGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "game-1",
    createdBy: pid("player-1"),
    players: { p1: pid("player-1"), p2: pid("player-2") },
    currentTurn: "p1",
    globalValue: 42,
    status: "active",
    moves: [],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("applySurrender", () => {
  it("should set p2 as winner when p1 surrenders", () => {
    const game = makeActiveGame();
    const result = applySurrender(game, pid("player-1"));

    expect(result.status).toBe("finished");
    expect(result.winnerId).toBe("player-2");
    expect(result.version).toBe(game.version + 1);
  });

  it("should set p1 as winner when p2 surrenders", () => {
    const game = makeActiveGame();
    const result = applySurrender(game, pid("player-2"));

    expect(result.status).toBe("finished");
    expect(result.winnerId).toBe("player-1");
    expect(result.version).toBe(game.version + 1);
  });

  it("should throw when game is not active (lobby)", () => {
    const game = makeActiveGame({ status: "lobby" });
    expect(() => applySurrender(game, pid("player-1"))).toThrow(
      "Game not active."
    );
  });

  it("should throw when game is not active (countdown)", () => {
    const game = makeActiveGame({ status: "countdown" });
    expect(() => applySurrender(game, pid("player-1"))).toThrow(
      "Game not active."
    );
  });

  it("should throw when game is not active (finished)", () => {
    const game = makeActiveGame({ status: "finished" });
    expect(() => applySurrender(game, pid("player-1"))).toThrow(
      "Game not active."
    );
  });

  it("should throw when player is not in the game", () => {
    const game = makeActiveGame();
    expect(() => applySurrender(game, pid("stranger"))).toThrow(
      "Player is not in this game."
    );
  });

  it("should preserve existing moves and other fields", () => {
    const game = makeActiveGame({
      globalValue: 75,
      moves: [
        {
          playerId: pid("player-1"),
          value: 5,
          moveNumber: 1,
          timestamp: new Date(),
        },
      ],
    });

    const result = applySurrender(game, pid("player-1"));

    expect(result.globalValue).toBe(75);
    expect(result.moves).toHaveLength(1);
    expect(result.id).toBe("game-1");
  });
});
