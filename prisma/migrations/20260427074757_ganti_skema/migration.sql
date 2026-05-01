/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AlumniUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Student', 'Alumni', 'AlumniMentor');

-- CreateEnum
CREATE TYPE "Degree" AS ENUM ('D3', 'D4', 'S1', 'S2', 'S3');

-- DropForeignKey
ALTER TABLE "AlumniUser" DROP CONSTRAINT "AlumniUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "StudentUser" DROP CONSTRAINT "StudentUser_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isAdmin",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "field" VARCHAR(50),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'Student',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "AlumniUser";

-- DropTable
DROP TABLE "StudentUser";

-- CreateTable
CREATE TABLE "UserSchool" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nim" VARCHAR(15),
    "campusName" VARCHAR(50) NOT NULL,
    "major" VARCHAR(50) NOT NULL,
    "degree" "Degree" NOT NULL,
    "intakeDate" DATE NOT NULL,
    "graduateDate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWork" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "workPlace" VARCHAR(50) NOT NULL,
    "fromYear" INTEGER NOT NULL,
    "toYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserWork_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserSchool" ADD CONSTRAINT "UserSchool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWork" ADD CONSTRAINT "UserWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
