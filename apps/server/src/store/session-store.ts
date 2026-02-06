import type Redis from "ioredis";
import type { Session, SessionId } from "../entities/session";
import { redis } from "../infrastructure/redis";

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
    return raw ? JSON.parse(raw) : undefined;
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
