-- Run these statements in your MySQL server to create the database and a dedicated user.
-- Example (run as root or a user with privileges):

CREATE DATABASE IF NOT EXISTS glisten CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Replace 'glisten_user' and 'strong_password' before running
CREATE USER IF NOT EXISTS 'glisten_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON glisten.* TO 'glisten_user'@'localhost';
FLUSH PRIVILEGES;

-- If you prefer to use root (not recommended), ensure root has a password and
-- set DB_USER=root and DB_PASS=your_root_password in .env
