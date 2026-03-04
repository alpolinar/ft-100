import type {
  Session,
  SessionId,
} from "../../domain/entities/session/session.js";
import { BaseRedisStore } from "../../lib/base-redis-store.js";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface ISessionStore {
  get(sessionId: SessionId): Promise<Session | null>;
  create(sessionId: SessionId, session: Session): Promise<void>;
  refresh(sessionId: SessionId): Promise<void>;
  delete(sessionId: SessionId): Promise<void>;
}

export class SessionStore
  extends BaseRedisStore<Session>
  implements ISessionStore {
  protected readonly keyPrefix = "sessionId";

  async get(sessionId: SessionId): Promise<Session | null> {
    return this.getById(sessionId);
  }

  async create(sessionId: SessionId, session: Session): Promise<void> {
    await this.setById(sessionId, session, SESSION_TTL_SECONDS);
  }

  async refresh(sessionId: SessionId): Promise<void> {
    await this.redis.expire(this.buildKey(sessionId), SESSION_TTL_SECONDS);
  }

  async delete(sessionId: SessionId): Promise<void> {
    await this.deleteById(sessionId);
  }
}
