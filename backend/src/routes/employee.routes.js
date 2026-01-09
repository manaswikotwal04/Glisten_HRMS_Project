import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import Employee from "../models/Employee.js";

const router = express.Router();

// ✅ Get all employees
router.get("/", auth, async (req, res) => {
  try {
    const employees = await Employee.find(); // already sorted
    res.json(employees);
  } catch (err) {
    console.error("GET EMPLOYEES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get employee by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Create employee
router.post("/", auth, async (req, res) => {
  try {
    const emp = await Employee.create(req.body);
    res.status(201).json(emp);
  } catch (err) {
    console.error("CREATE EMPLOYEE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update employee
router.put("/:id", auth, async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body);
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete employee
router.delete("/:id", auth, async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
