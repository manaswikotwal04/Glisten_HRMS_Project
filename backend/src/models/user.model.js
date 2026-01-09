import { sequelize, DataTypes } from "../config/db.js";

const UserModel = sequelize.define(
  "User",
  {
    _id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING,
    tempPassword: DataTypes.STRING,
    role: DataTypes.STRING,
    firstLogin: { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  { timestamps: true, tableName: "Users" }
);

class User {
  static async findOne(query = {}) {
    const row = await UserModel.findOne({ where: query });
    return row ? row.toJSON() : null;
  }

  static async create(data) {
    const created = await UserModel.create(data);
    return created.toJSON();
  }

  static async findByIdAndUpdate(id, data, opts = {}) {
    const row = await UserModel.findByPk(id);
    if (!row) return null;
    await row.update(data);
    return row.toJSON();
  }

  static async findById(id) {
    const row = await UserModel.findByPk(id);
    return row ? row.toJSON() : null;
  }
}

export default User;
