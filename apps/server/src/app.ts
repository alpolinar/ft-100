import Fastify from "fastify";

const initializeApp = async () => {
  const fastify = Fastify({
    logger: true,
  });

  fastify.get("/", (req, res) => {
    res.send({ hello: "world" });
  });
  await fastify.ready();
  return fastify;
};

export { initializeApp };
