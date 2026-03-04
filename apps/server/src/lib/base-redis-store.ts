import type { Redis } from "ioredis";

/**
 * Abstract base class for Redis-backed stores.
 *
 * Encapsulates the common patterns shared by every concrete store:
 * key prefixing, JSON serialization/deserialization, optional TTL,
 * and single-key deletion.
 *
 * Helpers are `protected` so each subclass can expose its own
 * domain-specific public API without leaking a generic CRUD surface.
 */
export abstract class BaseRedisStore<T> {
    protected abstract readonly keyPrefix: string;

    constructor(protected readonly redis: Redis) { }

    protected buildKey(id: string): string {
        return `${this.keyPrefix}:${id}`;
    }

    protected async getById(id: string): Promise<T | null> {
        const raw = await this.redis.get(this.buildKey(id));
        if (!raw) return null;
        return JSON.parse(raw) as T;
    }

    protected async setById(
        id: string,
        entity: T,
        ttlSeconds?: number,
    ): Promise<void> {
        const key = this.buildKey(id);
        if (ttlSeconds !== undefined) {
            await this.redis.set(key, JSON.stringify(entity), "EX", ttlSeconds);
        } else {
            await this.redis.set(key, JSON.stringify(entity));
        }
    }

    protected async deleteById(id: string): Promise<void> {
        await this.redis.del(this.buildKey(id));
    }
}
