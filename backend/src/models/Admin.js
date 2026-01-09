import { sequelize, DataTypes } from "../config/db.js";

const AdminModel = sequelize.define(
  "Admin",
  {
    _id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING
  },
  { tableName: "admins", timestamps: true }
);

class Admin {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static async findOne(query = {}) {
    const row = await AdminModel.findOne({ where: query });
    return row ? row.toJSON() : null;
  }

  static async create(data) {
    const created = await AdminModel.create(data);
    return created.toJSON();
  }
}

export default Admin;
