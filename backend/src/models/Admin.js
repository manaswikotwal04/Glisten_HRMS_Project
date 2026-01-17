import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Admin = sequelize.define("Admin", {
  email: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING
});

export default Admin;
