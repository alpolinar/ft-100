import { EventEmitter } from "node:events";
import { getLogger } from "../../../infrastructure/logging/index.js";

export const gameEvents = new EventEmitter();
export const logger = getLogger();
