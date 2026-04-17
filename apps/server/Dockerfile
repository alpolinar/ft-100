FROM node:24-slim AS base
RUN apt-get update -y && apt-get install -y openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune server --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/full/apps/server/prisma/ ./apps/server/prisma/
RUN pnpm install
COPY --from=builder /app/out/full/ .
# Generate Prisma client before building
RUN SKIP_ENV_VALIDATION=1 pnpm --filter server db:generate
RUN pnpm turbo run build --filter=server

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
EXPOSE 10000
CMD ["pnpm", "--filter", "server", "start"]
