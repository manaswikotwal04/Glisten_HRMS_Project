import { sequelize, DataTypes } from "../config/db.js";

/* =========================
   Sequelize Model
========================= */
const EmployeeModel = sequelize.define(
  "Employee",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    employeeId: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    department: DataTypes.STRING,
    role: DataTypes.STRING,
    joinDate: DataTypes.DATE,
    salary: DataTypes.FLOAT,
    bloodGroup: DataTypes.STRING,
    status: DataTypes.STRING,
    password: DataTypes.STRING,
    currentAddress: DataTypes.TEXT,
    permanentAddress: DataTypes.TEXT,
    bankName: DataTypes.STRING,
    accountNo: DataTypes.STRING,
    pfNo: DataTypes.STRING,
    pan: DataTypes.STRING,
    location: DataTypes.STRING
  },
  {
    tableName: "Employees",
    timestamps: true
  }
);

/* =========================
   Wrapper Class (IMPORTANT)
========================= */
class Employee {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  // CREATE
  static async create(data) {
    const row = await EmployeeModel.create(data);
    return row.toJSON();
  }

  // FIND ALL (NO SORTING — SAFE)
  static async find(filter = {}) {
    const rows = await EmployeeModel.findAll({
      where: filter
    });
    return rows.map(r => r.toJSON());
  }

  // FIND ONE
  static async findOne(query = {}) {
    const row = await EmployeeModel.findOne({ where: query });
    return row ? row.toJSON() : null;
  }

  // FIND BY ID
  static async findById(id) {
    const row = await EmployeeModel.findByPk(id);
    return row ? row.toJSON() : null;
  }

  // UPDATE
  static async findByIdAndUpdate(id, data) {
    const row = await EmployeeModel.findByPk(id);
    if (!row) return null;
    await row.update(data);
    return row.toJSON();
  }

  // DELETE
  static async findByIdAndDelete(id) {
    const row = await EmployeeModel.findByPk(id);
    if (!row) return null;
    await row.destroy();
    return { deleted: true };
  }
}

export default Employee;
