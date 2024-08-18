/*
  Warnings:

  - The primary key for the `vacancies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `vacancies` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "vacancies" DROP CONSTRAINT "vacancies_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id");
