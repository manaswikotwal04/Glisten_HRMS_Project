import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Read DB connection from env
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = process.env.DB_PORT || 3306;
const DB_NAME = process.env.DB_NAME || "glisten";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";   // ✅ FIXED

export const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export { DataTypes };

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL Connected ✅");

    await sequelize.sync();
    console.log("Models synchronized ✅");
  } catch (err) {
    console.error("DB Error ❌", err);
    process.exit(1);
  }
};

export default connectDB;
