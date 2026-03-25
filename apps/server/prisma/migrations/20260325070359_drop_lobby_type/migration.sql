/*
  Warnings:

  - You are about to drop the column `lobbyType` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "lobbyType";

-- DropEnum
DROP TYPE "LobbyType";
