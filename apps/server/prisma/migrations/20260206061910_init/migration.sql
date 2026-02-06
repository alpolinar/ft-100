-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('guest', 'registered');

-- CreateEnum
CREATE TYPE "LobbyType" AS ENUM ('open', 'invite');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('lobby', 'countdown', 'active', 'finished');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "type" "UserType" NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "invitedPlayerId" TEXT,
    "players" JSONB NOT NULL,
    "lobbyType" "LobbyType" NOT NULL,
    "currentTurn" TEXT NOT NULL,
    "globalValue" INTEGER NOT NULL,
    "status" "GameStatus" NOT NULL,
    "winnerId" TEXT,
    "countdown" INTEGER,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_createdAt_idx" ON "User"("deletedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
