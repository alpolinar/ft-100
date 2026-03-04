import type { Game } from "../../domain/entities/game.entity.js";
import { env } from "../../env.js";
import { BaseRedisStore } from "./base-redis-store.js";

export interface IGameStore {
  get(gameId: string): Promise<Game | null>;
  set(game: Game): Promise<void>;
  delete(gameId: string): Promise<void>;
}

export class GameStore extends BaseRedisStore<Game> implements IGameStore {
  protected readonly keyPrefix = "game";

  async get(gameId: string): Promise<Game | null> {
    return this.getById(gameId);
  }

  async set(game: Game): Promise<void> {
    await this.setById(game.id, game, env.GAME_TTL_SECONDS);
  }

  async delete(gameId: string): Promise<void> {
    await this.deleteById(gameId);
  }
}
