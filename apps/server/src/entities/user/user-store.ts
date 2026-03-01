import type { Redis } from "ioredis";
import type { User, UserId } from "./user.js";

export interface IUserStore {
  get(userId: UserId): Promise<User | null>;
  create(user: User): Promise<User>;
  delete(userId: UserId): Promise<void>;
}

export class UserStore implements IUserStore {
  constructor(private readonly redis: Redis) {}

  private getKey(userId: UserId): string {
    return `userId:${userId}`;
  }

  async get(userId: UserId): Promise<User | null> {
    const raw = await this.redis.get(this.getKey(userId));
    return raw ? JSON.parse(raw) : null;
  }

  async create(user: User): Promise<User> {
    await this.redis.set(
      this.getKey(user.id),
      JSON.stringify(user),
      "EX",
      60 * 60 * 24 * 7
    );

    return user;
  }

  async delete(userId: UserId): Promise<void> {
    await this.redis.del(this.getKey(userId));
  }
}
