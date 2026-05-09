/*
  Warnings:

  - You are about to drop the column `slug` on the `Lesson` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[title,language,level]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Lesson_slug_key";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "slug";

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_title_language_level_key" ON "Lesson"("title", "language", "level");
