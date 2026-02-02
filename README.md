⚠️ License Notice

This project is licensed under the Business Source License (BSL).
You may view and modify the source for non-production use.
Commercial use, hosting, or offering this software as a service
requires a separate license from the author.

# First To 100

**First To 100** is a real-time multiplayer game built as a side
project to explore **monorepos, lobby systems, server-authoritative game loops,
and live gameplay mechanics** using modern TypeScript tooling.

The goal of the game is simple: players take turns incrementing a shared value,
and the first to reach **100** wins.

The implementation, however, focuses on correctness, determinism, and real-time
architecture.

---

## Project Goals

This project is intentionally opinionated and educational. It explores:

* Server-authoritative real-time game loops
* Lobby → countdown → active game state transitions
* Deterministic turn handling
* tRPC subscriptions for live updates
* Redis-backed session storage
* Anti-cheat primitives (tick validation, nonces, replay protection)
* Auth design for multiplayer games
* Monorepo workflows with Turborepo

---

## Tech Stack

* **TypeScript** everywhere
* **Fastify** — backend HTTP + SSE
* **tRPC** — type-safe API and subscriptions
* **Next.js (App Router)** — frontend
* **TanStack Query** — client data & mutations
* **Redis** — session storage and ephemeral state
* **PostgreSQL** — persistence, history, leaderboards
* **Docker / Docker Compose** — local infra
* **Turborepo** — monorepo orchestration

---

## Monorepo Structure

This Turborepo includes the following apps and packages:

### Apps

* `server`
  A Fastify server providing:

  * tRPC routers (queries, mutations, subscriptions)
  * Server-authoritative game loop
  * Redis-backed session/auth store
  * Real-time game event broadcasting

* `web`
  A Next.js app providing:

  * Lobby and game UI
  * Live state updates via tRPC subscriptions
  * Client-side game input handling
  * Auth session hydration

### Packages

* `@repo/ui`
  Shared React UI components (stubbed for now).

* `@repo/typescript-config`
  Shared `tsconfig` presets used across the monorepo.

Each package/app is **100% TypeScript**.

---

## Game Flow Overview

1. **Lobby**

   * Player creates or joins a game
   * Server assigns player identity
   * Lobby fills to required player count

2. **Countdown**

   * Server starts a countdown when lobby is full
   * Countdown state is broadcast to all clients

3. **Game Start**

   * Server determines turn order

4. **Active Game**

   * Server advances a global tick
   * Players submit moves with:

     * `tick` (last known server tick)
     * `nonce` (monotonic per-client input id)
   * Server validates and applies moves

5. **Game End**

   * Winner determined server-side
   * Final state broadcast to all players

---

## Real-Time Architecture

* **Server is authoritative**

  * Clients never advance time
  * Clients never decide outcomes
* **State changes are broadcast**

  * tRPC subscriptions stream game events
* **Input is validated**

  * Tick validation prevents speed hacks
  * Nonces prevent replay attacks

---

## Auth & Sessions

* Session-based auth
* Redis used as a centralized session store
* Session resolved in Fastify and injected into tRPC context
* Frontend hydrates session state for player identity

This keeps auth:

* Simple
* Scalable
* Compatible with real-time subscriptions

---

## Anti-Cheat Principles

The project implements foundational anti-cheat techniques:

* Server-controlled ticks
* Monotonic client nonces
* Replay detection
* Turn validation
* Server-only state mutation

This is **not** client-trusting logic.

---

## Local Development

### Prerequisites

* Mise (mise-en-place)
* Node.js (LTS)
* pnpm
* Docker + Docker Compose

### Dev Environment Installation

```bash
mise install
```

### Start Local Infrastructure

```bash
docker compose up -d
```

### Install Dependencies

```bash
pnpm install
```

### Run the Monorepo

```bash
pnpm dev
```

---

## Status

This project is **actively evolving** and intended as a learning and
experimentation playground rather than a production game.

Expect:

* Iteration
* Refactors
* Architectural experiments
