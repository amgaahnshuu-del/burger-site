ALTER TABLE `OrderItem`
  ADD COLUMN `foodName` VARCHAR(191) NULL,
  ADD COLUMN `foodImage` LONGTEXT NULL,
  ADD COLUMN `foodCategory` VARCHAR(191) NULL;

UPDATE `OrderItem` AS `oi`
LEFT JOIN `Food` AS `f`
  ON `f`.`id` = `oi`.`foodId`
SET
  `oi`.`foodName` = COALESCE(`oi`.`foodName`, `f`.`name`, 'Deleted food'),
  `oi`.`foodImage` = COALESCE(`oi`.`foodImage`, `f`.`image`, ''),
  `oi`.`foodCategory` = COALESCE(`oi`.`foodCategory`, `f`.`category`, 'Uncategorized')
WHERE
  `oi`.`foodName` IS NULL
  OR `oi`.`foodImage` IS NULL
  OR `oi`.`foodCategory` IS NULL;

ALTER TABLE `OrderItem`
  MODIFY `foodName` VARCHAR(191) NOT NULL,
  MODIFY `foodImage` LONGTEXT NOT NULL,
  MODIFY `foodCategory` VARCHAR(191) NOT NULL,
  MODIFY `foodId` VARCHAR(191) NULL;

ALTER TABLE `OrderItem`
  DROP FOREIGN KEY `OrderItem_foodId_fkey`;

ALTER TABLE `OrderItem`
  ADD CONSTRAINT `OrderItem_foodId_fkey`
  FOREIGN KEY (`foodId`) REFERENCES `Food`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX `OrderItem_foodId_idx` ON `OrderItem`(`foodId`);
