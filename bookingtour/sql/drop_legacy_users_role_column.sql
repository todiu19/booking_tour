-- Remove redundant VARCHAR `role` on `users` if present.
-- Use only `role_id` + table `roles`. Connect to the correct schema in Workbench before running.

SET @db := DATABASE();
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE users DROP COLUMN `role`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
