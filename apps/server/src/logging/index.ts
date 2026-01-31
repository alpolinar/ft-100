import type { FastifyBaseLogger } from "fastify";
import pino from "pino";
import { pinoConfig } from "./config";

let fastifyLogger: FastifyBaseLogger | null = null;

export function bindFastifyLogger(logger: FastifyBaseLogger) {
	fastifyLogger = logger;
}

export function getLogger() {
	if (fastifyLogger) return fastifyLogger;

	// Non-HTTP contexts (scripts, workers, tests)
	return pino(pinoConfig);
}
