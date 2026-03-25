import type { Redis } from "ioredis";

const QUEUE_KEY = "matchmaking:queue";

/**
 * Lua script that atomically finds and removes the first opponent
 * in the sorted set who is NOT the requesting player.
 *
 * KEYS[1] = queue key
 * ARGV[1] = current player ID (to exclude from matching)
 *
 * Returns the opponent's player ID, or nil if no opponent is available.
 */
const DEQUEUE_OPPONENT_SCRIPT = `
local members = redis.call('ZRANGE', KEYS[1], 0, 1)
for _, id in ipairs(members) do
  if id ~= ARGV[1] then
    redis.call('ZREM', KEYS[1], id)
    return id
  end
end
return nil
`;

export class MatchmakingStore {
  constructor(private readonly redis: Redis) {}

  /**
   * Add a player to the matchmaking queue.
   * Score = timestamp for FIFO ordering.
   * NX ensures duplicate enqueues don't update the timestamp.
   */
  async enqueue(playerId: string): Promise<void> {
    await this.redis.zadd(QUEUE_KEY, "NX", Date.now(), playerId);
  }

  /**
   * Atomically find and remove the first opponent who isn't `currentPlayerId`.
   * Uses a Lua script to prevent race conditions between concurrent findMatch calls.
   */
  async dequeueOpponent(currentPlayerId: string): Promise<string | null> {
    const result = await this.redis.eval(
      DEQUEUE_OPPONENT_SCRIPT,
      1,
      QUEUE_KEY,
      currentPlayerId
    );

    return (result as string) ?? null;
  }

  /**
   * Remove a player from the queue (cancellation).
   */
  async remove(playerId: string): Promise<void> {
    await this.redis.zrem(QUEUE_KEY, playerId);
  }

  /**
   * Check if a player is currently in the queue.
   */
  async isQueued(playerId: string): Promise<boolean> {
    const score = await this.redis.zscore(QUEUE_KEY, playerId);
    return score !== null;
  }
}
