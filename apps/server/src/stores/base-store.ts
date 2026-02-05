import type { FastifyBaseLogger } from "fastify";
import type Redis from "ioredis";
import crypto from "node:crypto";
import { redis } from "../infrastructure/redis";
import { getLogger } from "../logging";

export type Persisted = {
  id: string;
};

export interface IBaseStore<
  DomainObject,
  CreateInput extends DomainObject,
  QueryInput,
> {
  get(input: QueryInput): Promise<DomainObject | undefined>;
  create(input: CreateInput): Promise<DomainObject & Persisted>;
  delete(input: QueryInput): Promise<boolean>;
}

export abstract class BaseStore<
  DomainObject extends object,
  CreateInput extends DomainObject,
  QueryInput extends string,
> implements IBaseStore<DomainObject, CreateInput, QueryInput>
{
  private redis: Redis;
  private logger: FastifyBaseLogger;

  constructor() {
    this.redis = redis;
    this.logger = getLogger();
  }

  protected abstract buildKey(id: string): string;

  async get(input: QueryInput): Promise<DomainObject | undefined> {
    this.logger.info("Finding Record");
    const raw = await this.redis.get(this.buildKey(input));
    return raw ? JSON.parse(raw) : undefined;
  }

  async create(input: CreateInput): Promise<DomainObject & Persisted> {
    this.logger.info("Creating Record");
    try {
      const id = crypto.randomUUID();
      await this.redis.set(
        this.buildKey(id),
        JSON.stringify(input),
        "EX",
        60 * 60 * 24 * 7
      );
      return { ...input, id };
    } catch (error: unknown) {
      this.logger.error(error, "Failed To Create Record");
      throw error;
    }
  }

  async delete(input: QueryInput): Promise<boolean> {
    this.logger.info("Deleting Record");
    try {
      const result = await this.redis.del(this.buildKey(input));
      return result > 0;
    } catch (error: unknown) {
      this.logger.error(error, "Failed To Delete Record");
      throw error;
    }
  }
}
