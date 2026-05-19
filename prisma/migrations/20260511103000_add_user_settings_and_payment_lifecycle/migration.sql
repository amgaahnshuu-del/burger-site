-- AlterTable
ALTER TABLE `Order`
    ADD COLUMN `addressLabel` VARCHAR(191) NULL,
    ADD COLUMN `addressDistrict` VARCHAR(191) NULL,
    ADD COLUMN `addressKhoroo` VARCHAR(191) NULL,
    ADD COLUMN `addressUnit` VARCHAR(191) NULL,
    ADD COLUMN `addressLatitude` DOUBLE NULL,
    ADD COLUMN `addressLongitude` DOUBLE NULL,
    ADD COLUMN `addressNotes` TEXT NULL,
    ADD COLUMN `acceptedAt` DATETIME(3) NULL,
    ADD COLUMN `readyForCourierAt` DATETIME(3) NULL,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `cancelReason` TEXT NULL;

-- AlterTable
ALTER TABLE `Payment`
    MODIFY `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `providerReference` VARCHAR(191) NULL,
    ADD COLUMN `providerPayload` JSON NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `failedAt` DATETIME(3) NULL,
    ADD COLUMN `refundedAt` DATETIME(3) NULL,
    ADD COLUMN `failureReason` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `UserSettings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `notificationsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `preferredPaymentMethod` ENUM('CASH', 'CARD', 'QPAY') NOT NULL DEFAULT 'QPAY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSettings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedAddress` (
    `id` VARCHAR(191) NOT NULL,
    `userSettingsId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `details` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `district` VARCHAR(191) NULL,
    `khoroo` VARCHAR(191) NULL,
    `apartmentUnit` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SavedAddress_userSettingsId_idx`(`userSettingsId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserSettings`
    ADD CONSTRAINT `UserSettings_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedAddress`
    ADD CONSTRAINT `SavedAddress_userSettingsId_fkey`
    FOREIGN KEY (`userSettingsId`) REFERENCES `UserSettings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
