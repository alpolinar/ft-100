import { BaseRedisStore } from "./base-redis-store.js";

const CODE_TTL_SECONDS = 60 * 10; // 10 minutes for unverified codes
const VERIFIED_TTL_SECONDS = 60 * 15; // 15 minutes for verified state

type StoredEmailVerification = {
  email: string;
  code: string;
  verified: boolean;
};

export interface IEmailVerificationStore {
  setCode(userId: string, email: string, code: string): Promise<void>;
  getCode(userId: string): Promise<StoredEmailVerification | null>;
  markVerified(userId: string): Promise<void>;
  getVerified(userId: string): Promise<StoredEmailVerification | null>;
  delete(userId: string): Promise<void>;
}

export class EmailVerificationStore
  extends BaseRedisStore<StoredEmailVerification>
  implements IEmailVerificationStore
{
  protected readonly keyPrefix = "email-verification";

  async setCode(userId: string, email: string, code: string): Promise<void> {
    await this.setById(
      userId,
      { email, code, verified: false },
      CODE_TTL_SECONDS
    );
  }

  async getCode(userId: string): Promise<StoredEmailVerification | null> {
    return this.getById(userId);
  }

  async markVerified(userId: string): Promise<void> {
    const stored = await this.getById(userId);
    if (!stored) return;
    await this.setById(
      userId,
      { ...stored, verified: true },
      VERIFIED_TTL_SECONDS
    );
  }

  async getVerified(userId: string): Promise<StoredEmailVerification | null> {
    const stored = await this.getById(userId);
    if (!stored || !stored.verified) return null;
    return stored;
  }

  async delete(userId: string): Promise<void> {
    await this.deleteById(userId);
  }
}
