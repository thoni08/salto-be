/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - A unique constraint covering the columns `[userName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "username",
ADD COLUMN     "email" VARCHAR(100) NOT NULL,
ADD COLUMN     "fullName" VARCHAR(100) NOT NULL,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userName" VARCHAR(30) NOT NULL,
ALTER COLUMN "password" SET DATA TYPE VARCHAR(500);

-- CreateTable
CREATE TABLE "StudentUser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nim" VARCHAR(15) NOT NULL,
    "major" VARCHAR(50) NOT NULL,
    "batch" INTEGER NOT NULL,
    "campus" VARCHAR(50) NOT NULL,

    CONSTRAINT "StudentUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniUser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "field" VARCHAR(50) NOT NULL,
    "campusOrigin" VARCHAR(50) NOT NULL,
    "graduateYear" INTEGER NOT NULL,
    "major" VARCHAR(50) NOT NULL,
    "currentWorkPlace" VARCHAR(100) NOT NULL,
    "isPhD" BOOLEAN NOT NULL DEFAULT false,
    "isMentor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AlumniUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentUser_userId_key" ON "StudentUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlumniUser_userId_key" ON "AlumniUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "StudentUser" ADD CONSTRAINT "StudentUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniUser" ADD CONSTRAINT "AlumniUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
