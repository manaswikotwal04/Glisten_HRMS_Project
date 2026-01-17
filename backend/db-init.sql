

CREATE DATABASE IF NOT EXISTS glisten CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE USER IF NOT EXISTS 'glisten_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON glisten.* TO 'glisten_user'@'localhost';
FLUSH PRIVILEGES;

