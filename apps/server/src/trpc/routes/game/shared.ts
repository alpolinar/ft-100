import { getLogger } from "../../../infrastructure/logging/index.js";
import { pubClient, subClient } from "../../../infrastructure/redis.js";

class RedisEventEmitter {
  async emit<T>(channel: string, payload: T) {
    await pubClient.publish(channel, JSON.stringify(payload));
    return true;
  }

  on<T>(channel: string, handler: (data: T) => void) {
    subClient.subscribe(channel);
    const listener = (chan: string, message: string) => {
      if (chan === channel) {
        handler(JSON.parse(message) as T);
      }
    };
    subClient.on("message", listener);
    return listener;
  }

  off(_channel: string, listener: (chan: string, message: string) => void) {
    subClient.removeListener("message", listener);
  }
}

export const gameEvents = new RedisEventEmitter();
export const logger = getLogger();
