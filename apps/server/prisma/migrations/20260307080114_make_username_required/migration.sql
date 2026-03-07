/*
  Warnings:

  - Made the column `username` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- Give existing guests a generated name if it is null
UPDATE "User"
SET "username" = 'Guest_' || FLOOR(1000 + RANDOM() * 9000)::TEXT
WHERE "username" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
