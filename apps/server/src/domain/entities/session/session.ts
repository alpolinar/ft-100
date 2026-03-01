import z from "zod";
import type { UserId } from "../user/user.js";

export const SessionIdSchema = z.string().brand<"SessionId">();

export type SessionId = z.infer<typeof SessionIdSchema>;

export type Session = {
  userId: UserId;
  createdAt: Date;
};
