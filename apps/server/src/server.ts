import { initializeApp } from "./app";

const start = async () => {
    const app = await initializeApp();
    try {
        app.listen({ port: 3001 });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

start();
