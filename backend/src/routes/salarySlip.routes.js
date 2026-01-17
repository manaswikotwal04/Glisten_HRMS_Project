import express from "express";
import {
  generateSalarySlip,
  listSalarySlips,
  deleteSalarySlip,
  getPayslipsByEmployee
} from "../controllers/salarySlip.controller.js";

const router = express.Router();

router.post("/generate", generateSalarySlip);
router.get("/list", listSalarySlips);   
router.get("/employee/:employeeId", getPayslipsByEmployee);
router.delete("/delete/:id", deleteSalarySlip); // ✅ FIX

export default router;
