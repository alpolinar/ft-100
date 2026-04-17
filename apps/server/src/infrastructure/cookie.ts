import type { CookieSerializeOptions } from "@fastify/cookie";
import { env } from "../env.js";

export const SESSION_COOKIE_NAME = "session";

export const sessionCookieOptions: CookieSerializeOptions = {
  path: "/",
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: env.SESSION_COOKIE_MAX_AGE,
};
