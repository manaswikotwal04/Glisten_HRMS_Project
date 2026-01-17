import express from "express";
import {
  addSalaryStructure,
  getSalaryHistory
} from "../controllers/salary.controller.js";

const router = express.Router();

router.post("/", addSalaryStructure);


router.get("/:employeeId", getSalaryHistory);

export default router;
