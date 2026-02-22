-- AlterTable
ALTER TABLE "User" ADD COLUMN "clientCompanyId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "ClientCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
