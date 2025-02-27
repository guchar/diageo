/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `hashedPassword` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- SQLite does not support ALTER COLUMN, so we need to recreate the table
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notificationPrefs" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Copy the data
INSERT INTO "new_User" ("id", "email", "hashedPassword", "name", "notificationPrefs", "createdAt", "updatedAt")
SELECT "id", "email", "password", "name", "notificationPrefs", "createdAt", "updatedAt"
FROM "User";

-- Drop the old table and rename the new one
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

-- Recreate the unique index
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
