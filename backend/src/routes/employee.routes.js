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

router.post("/add", addEmployee);

router.get("/", getAllEmployees);
router.get("/inactive", getInactiveEmployees);

router.get("/id/:id", getEmployeeById);
router.get("/employeeId/:employeeId", getEmployeeByEmployeeId);

router.put("/:id", updateEmployee);
router.put("/restore/:id", restoreEmployee);
router.delete("/:id", deleteEmployee);          
router.delete("/hard/:id", hardDeleteEmployee); 

export default router;
