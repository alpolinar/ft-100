import { BaseRedisStore } from "./base-redis-store.js";

const CHALLENGE_TTL_SECONDS = 60 * 5; // 5 minutes

type StoredChallenge = {
  challenge: string;
};

export interface IChallengeStore {
  get(userId: string): Promise<string | null>;
  set(userId: string, challenge: string): Promise<void>;
  delete(userId: string): Promise<void>;
}

export class ChallengeStore
  extends BaseRedisStore<StoredChallenge>
  implements IChallengeStore
{
  protected readonly keyPrefix = "webauthn:challenge";

  async get(userId: string): Promise<string | null> {
    const stored = await this.getById(userId);
    return stored?.challenge ?? null;
  }

  async set(userId: string, challenge: string): Promise<void> {
    await this.setById(userId, { challenge }, CHALLENGE_TTL_SECONDS);
  }

  async delete(userId: string): Promise<void> {
    await this.deleteById(userId);
  }
}
