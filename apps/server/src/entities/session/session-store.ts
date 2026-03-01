import type { Redis } from "ioredis";
import type { Session, SessionId } from "./session.js";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface ISessionStore {
  get(sessionId: SessionId): Promise<Session | null>;
  create(sessionId: SessionId, session: Session): Promise<void>;
  refresh(sessionId: SessionId): Promise<void>;
  delete(sessionId: SessionId): Promise<void>;
}

export class SessionStore implements ISessionStore {
  constructor(private readonly redis: Redis) {}

  private getKey(sessionId: SessionId): string {
    return `sessionId:${sessionId}`;
  }

  async get(sessionId: SessionId): Promise<Session | null> {
    const raw = await this.redis.get(this.getKey(sessionId));
    return raw ? JSON.parse(raw) : null;
  }

  async create(sessionId: SessionId, session: Session): Promise<void> {
    await this.redis.set(
      this.getKey(sessionId),
      JSON.stringify(session),
      "EX",
      SESSION_TTL_SECONDS
    );
  }

  async refresh(sessionId: SessionId): Promise<void> {
    await this.redis.expire(this.getKey(sessionId), SESSION_TTL_SECONDS);
  }

  async delete(sessionId: SessionId): Promise<void> {
    await this.redis.del(this.getKey(sessionId));
  }
}
