/*
  Warnings:

  - A unique constraint covering the columns `[wp_id]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "clients_wp_id_key" ON "clients"("wp_id");
