import express from "express";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import User from "../models/user.model.js";

const router = express.Router();

// ➕ Create employee
router.post("/employee/create", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash the provided password and create both Employee and User records
    const hashed = password ? await bcrypt.hash(password, 10) : null;

    const emp = await Employee.create({ ...req.body, password: hashed, status: "first_login_pending" });

    // Create auth User record so login/reset flow works (if email provided)
    if (email) {
      await User.create({
        name: name || req.body.name || "",
        email,
        tempPassword: hashed,
        firstLogin: true,
        role: "employee"
      });
    }

    res.status(201).json({ message: "Employee created", emp });
  } catch (err) {
    // handle duplicate key errors and validation
    if (err.code === 11000) return res.status(400).json({ message: "Duplicate field value", error: err.keyValue });
    res.status(400).json({ message: err.message });
  }
});

// 📃 Get all employees
router.get("/employees", async (req, res) => {
  const list = await Employee.find();
  res.json(list);
});

// ✏ Update employee
router.put("/employee/:id", async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(emp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🗑 Delete employee
router.delete("/employee/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
