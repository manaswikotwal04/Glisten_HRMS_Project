import bcrypt from "bcrypt";
import User from "../models/user.model.js";

export const createEmployeeAccount = async (req, res) => {
  try {
    const { name, email, tempPassword } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Employee already exists" });

    const hash = await bcrypt.hash(tempPassword, 10);

    const employee = await User.create({
      name,
      email,
      tempPassword: hash,
      role: "employee",
      firstLogin: true
    });

    res.status(201).json({
      message: "Employee account created",
      employee
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
