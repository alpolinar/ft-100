import crypto from "node:crypto";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

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
