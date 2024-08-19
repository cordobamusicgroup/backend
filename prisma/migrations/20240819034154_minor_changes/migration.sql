/*
  Warnings:

  - You are about to drop the `menus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `submenus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "submenus" DROP CONSTRAINT "submenus_menuId_fkey";

-- DropTable
DROP TABLE "menus";

-- DropTable
DROP TABLE "submenus";

-- DropEnum
DROP TYPE "MenuType";
