import type Redis from "ioredis";
import type { User, UserId } from "../entities/user";
import { redis } from "../infrastructure/redis";

export interface IUserStore {
  get(userId: UserId): Promise<User | undefined>;
  create(user: User): Promise<User>;
  delete(userId: UserId): Promise<void>;
}

export class RedisUserStore implements IUserStore {
  constructor(private readonly redis: Redis) {}

  private getKey(userId: UserId): string {
    return `userId:${userId}`;
  }

  async get(userId: UserId): Promise<User | undefined> {
    const raw = await this.redis.get(this.getKey(userId));
    return raw ? JSON.parse(raw) : undefined;
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

export const userStore = new RedisUserStore(redis);
