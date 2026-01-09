import { sequelize, DataTypes } from "../config/db.js";

const PayrollModel = sequelize.define(
  "Payroll",
  {
    _id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    employeeId: { type: DataTypes.STRING, allowNull: false },
    name: DataTypes.STRING,
    department: DataTypes.STRING,
    designation: DataTypes.STRING,
    month: DataTypes.STRING,

    bankName: DataTypes.STRING,
    accountNo: DataTypes.STRING,

    basic: DataTypes.FLOAT,
    hra: DataTypes.FLOAT,
    specialAllowance: DataTypes.FLOAT,
    projectBonus: DataTypes.FLOAT,
    additionalBonus: DataTypes.FLOAT,
    professionalDevelopment: DataTypes.FLOAT,
    cca: DataTypes.FLOAT,

    professionTax: DataTypes.FLOAT,
    otherDeductions: DataTypes.FLOAT,

    totalEarnings: DataTypes.FLOAT,
    totalDeductions: DataTypes.FLOAT,
    netPay: DataTypes.FLOAT,

    status: { type: DataTypes.STRING, defaultValue: "Generated" },
    fileUrl: DataTypes.STRING
  },
  { timestamps: true, tableName: "Payrolls" }
);

class Payroll {
  static async find(filter = {}) {
    const rows = await PayrollModel.findAll({ where: filter, order: [["createdAt", "DESC"]] });
    return rows.map(r => r.toJSON());
  }

  static async findById(id) {
    const row = await PayrollModel.findByPk(id);
    return row ? row.toJSON() : null;
  }

  static async create(data) {
    const created = await PayrollModel.create(data);
    return created.toJSON();
  }

  static async findByIdAndDelete(id) {
    const row = await PayrollModel.findByPk(id);
    if (!row) return null;
    await row.destroy();
    return { deleted: true };
  }
}

export default Payroll;
