-- AlterTable
ALTER TABLE `User`
    MODIFY `role` ENUM('CUSTOMER', 'ADMIN', 'COURIER') NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE `Order`
    ADD COLUMN `courierId` VARCHAR(191) NULL,
    ADD COLUMN `contactPhone` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Order_courierId_idx` ON `Order`(`courierId`);

-- AddForeignKey
ALTER TABLE `Order`
    ADD CONSTRAINT `Order_courierId_fkey`
    FOREIGN KEY (`courierId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
