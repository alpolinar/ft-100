import type { User, UserId } from "../../domain/entities/user.entity.js";
import { BaseRedisStore } from "./base-redis-store.js";

const USER_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface IUserStore {
  get(userId: UserId): Promise<User | null>;
  create(user: User): Promise<User>;
  delete(userId: UserId): Promise<void>;
}

export class UserStore extends BaseRedisStore<User> implements IUserStore {
  protected readonly keyPrefix = "userId";

  async get(userId: UserId): Promise<User | null> {
    return this.getById(userId);
  }

  async create(user: User): Promise<User> {
    await this.setById(user.id, user, USER_TTL_SECONDS);
    return user;
  }

  async delete(userId: UserId): Promise<void> {
    await this.deleteById(userId);
  }
}
