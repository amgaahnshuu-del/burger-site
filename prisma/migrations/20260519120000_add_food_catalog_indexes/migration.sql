-- CreateIndex
CREATE INDEX `Food_isAvailable_createdAt_idx`
ON `Food`(`isAvailable`, `createdAt`);

-- CreateIndex
CREATE INDEX `Food_restaurantId_isAvailable_createdAt_idx`
ON `Food`(`restaurantId`, `isAvailable`, `createdAt`);
