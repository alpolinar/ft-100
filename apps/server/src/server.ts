import cors from "@fastify/cors";
import Fastify from "fastify";

// TODO: replace with env variables
const allowedOrigins = [
    "http://localhost:3000", // Next.js dev
    "http://127.0.0.1:3000",
];

const fastify = Fastify({
    logger: true,
});

fastify.register(cors, {
    origin: (origin, callback) => {
        // Allow no origin (e.g., mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Reject unknown origins
        return callback(new Error("Not allowed by CORS"), false);
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true, // allow JWT cookies, auth cookies, etc.
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length"],
    maxAge: 86400, // cache preflight for 1 da
});

fastify.get("/", async () => {
    return { message: "hello world" };
});

(async () => {
    try {
        await fastify.listen({
            port: 3001,
        });
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
})();
