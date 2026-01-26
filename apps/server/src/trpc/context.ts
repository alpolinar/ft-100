import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import crypto from "crypto";

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  let playerId = req.cookies.playerId;

  if (!playerId) {
    playerId = crypto.randomUUID();
    res.setCookie("playerId", playerId, {
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return {
    user: {
      id: playerId,
      isGuest: true,
    },
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
