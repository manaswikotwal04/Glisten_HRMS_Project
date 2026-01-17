import express from "express";
import {
  addSalaryStructure,
  getSalaryHistory
} from "../controllers/salary.controller.js";

const router = express.Router();

/* ADD SALARY STRUCTURE */
router.post("/", addSalaryStructure);

/* GET SALARY HISTORY */
router.get("/:employeeId", getSalaryHistory);

export default router;
