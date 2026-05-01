/*
  Warnings:

  - Added the required column `isMentor` to the `UserWork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPhd` to the `UserWork` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserWork" ADD COLUMN     "isMentor" BOOLEAN NOT NULL,
ADD COLUMN     "isPhd" BOOLEAN NOT NULL;
