import type Redis from "ioredis";
import { isNullish } from "remeda";
import z from "zod";
import type { UserId } from "../entities/user";
import { redis } from "../infrastructure/redis";

const SessionIdSchema = z.string().brand<"SessionId">();

export type SessionId = z.infer<typeof SessionIdSchema>;

export type Session = {
  userId: UserId;
  createdAt: Date;
};

export interface ISessionStore {
  get(sessionId: SessionId): Promise<Session | undefined>;
  create(sessionId: SessionId, session: Session): Promise<void>;
  delete(sessionId: SessionId): Promise<void>;
}

class SessionStore implements ISessionStore {
  constructor(private readonly redis: Redis) {}

  private getKey(sessionId: SessionId): string {
    return `sessionId:${sessionId}`;
  }

  async get(sessionId: SessionId): Promise<Session | undefined> {
    const raw = await this.redis.get(this.getKey(sessionId));

    if (isNullish(raw)) {
      return undefined;
    }

    return JSON.parse(raw);
  }

  async create(sessionId: SessionId, session: Session): Promise<void> {
    await this.redis.set(
      this.getKey(sessionId),
      JSON.stringify(session),
      "EX",
      60 * 60 * 24 * 7
    );
  }

  async delete(sessionId: SessionId): Promise<void> {
    await this.redis.del(this.getKey(sessionId));
  }
}

export const sessionStore = new SessionStore(redis);
