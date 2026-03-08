FROM node:24-slim AS base
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
RUN pnpm install
COPY --from=builder /app/out/full/ .
# Generate Prisma client before building
RUN pnpm --filter server db:generate
RUN pnpm turbo run build --filter=server

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
EXPOSE 10000
CMD ["pnpm", "--filter", "server", "start"]
