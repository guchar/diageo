/*
  Warnings:

  - You are about to drop the column `userId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `JobMatch` table. All the data in the column will be lost.
  - You are about to drop the column `remote` on the `JobMatch` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `JobMatch` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `User` table. All the data in the column will be lost.
  - Added the required column `applyLink` to the `JobMatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobProfileId` to the `JobMatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `JobMatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `JobMatch` table without a default value. This is not possible if the table is not empty.
  - Made the column `location` on table `JobMatch` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "careerPageUrl" TEXT NOT NULL,
    "selectorsConfig" TEXT NOT NULL,
    "lastScanTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("careerPageUrl", "createdAt", "id", "lastScanTime", "name", "selectorsConfig", "updatedAt") SELECT "careerPageUrl", "createdAt", "id", "lastScanTime", "name", "selectorsConfig", "updatedAt" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE TABLE "new_JobMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "applyLink" TEXT NOT NULL,
    "postedDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobMatch_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_JobMatch" ("createdAt", "description", "id", "location", "postedDate", "title") SELECT "createdAt", "description", "id", "location", "postedDate", "title" FROM "JobMatch";
DROP TABLE "JobMatch";
ALTER TABLE "new_JobMatch" RENAME TO "JobMatch";
CREATE INDEX "JobMatch_jobProfileId_idx" ON "JobMatch"("jobProfileId");
CREATE INDEX "JobMatch_applyLink_idx" ON "JobMatch"("applyLink");
CREATE TABLE "new_JobProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_JobProfile" ("companyId", "createdAt", "id", "jobTitle", "location", "remote", "updatedAt", "userId") SELECT "companyId", "createdAt", "id", "jobTitle", "location", "remote", "updatedAt", "userId" FROM "JobProfile";
DROP TABLE "JobProfile";
ALTER TABLE "new_JobProfile" RENAME TO "JobProfile";
CREATE INDEX "JobProfile_userId_idx" ON "JobProfile"("userId");
CREATE INDEX "JobProfile_companyId_idx" ON "JobProfile"("companyId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notificationPrefs" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "notificationPrefs", "password", "updatedAt") SELECT "createdAt", "email", "id", "name", "notificationPrefs", "password", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
