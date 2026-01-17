import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Employee = sequelize.define("Employee", {
  name: DataTypes.STRING,
  employeeId: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  department: DataTypes.STRING,
  role: DataTypes.STRING,
  joinDate: DataTypes.DATE,
  salary: DataTypes.FLOAT,
  bloodGroup: DataTypes.STRING,
  password: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: "Active" },
  firstLogin: { type: DataTypes.BOOLEAN, defaultValue: true }
});

export default Employee;
