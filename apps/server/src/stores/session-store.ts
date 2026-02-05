import type { Session } from "../entities/session";
import { BaseStore, type IBaseStore } from "./base-store";

export interface ISessionStore extends IBaseStore<Session, Session, string> {}

export class SessionStore
  extends BaseStore<Session, Session, string>
  implements ISessionStore
{
  protected buildKey(id: string): string {
    return `session:${id}`;
  }
}

export const sessionStore = new SessionStore();
