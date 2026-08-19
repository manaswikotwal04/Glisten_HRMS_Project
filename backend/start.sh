#!/bin/sh

cd /app/backend

sed -i "s/DB_HOST=localhost/DB_HOST=$DB_HOST/g" .env
sed -i "s/DB_PORT=3306/DB_PORT=$DB_PORT/g" .env
sed -i "s/DB_NAME=glisten/DB_NAME=$DB_NAME/g" .env
sed -i "s/DB_USER=root/DB_USER=$DB_USER/g" .env
sed -i "s/DB_PASSWORD=manaswi/DB_PASSWORD=$DB_PASSWORD/g"

node src/server.js
