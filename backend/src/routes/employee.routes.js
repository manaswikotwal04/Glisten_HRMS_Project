import express from "express";
import {
  addEmployee,
  getAllEmployees,
  getInactiveEmployees,
  getEmployeeById,
  getEmployeeByEmployeeId,
  updateEmployee,
  deleteEmployee,
  restoreEmployee,
  hardDeleteEmployee
} from "../controllers/employee.controller.js";

const router = express.Router();

/* ================= CREATE ================= */
router.post("/add", addEmployee);

/* ================= READ ================= */
router.get("/", getAllEmployees);
router.get("/inactive", getInactiveEmployees);

/* 🔹 Explicit ID routes */
router.get("/id/:id", getEmployeeById);
router.get("/employeeId/:employeeId", getEmployeeByEmployeeId);

/* ================= UPDATE ================= */
router.put("/:id", updateEmployee);
router.put("/restore/:id", restoreEmployee);

/* ================= DELETE ================= */
router.delete("/:id", deleteEmployee);          // soft delete
router.delete("/hard/:id", hardDeleteEmployee); // hard delete

export default router;
