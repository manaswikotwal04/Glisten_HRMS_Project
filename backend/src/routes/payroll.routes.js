import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import { getPayslips, generatePayslip, deletePayslip } from "../controllers/payroll.controller.js";
import { downloadPayslip } from "../controllers/payroll.controller.js";

const router = express.Router();

router.get("/slips", auth, getPayslips);
router.post("/generate", auth, generatePayslip);
router.get("/download/:id", auth, downloadPayslip);
router.delete("/:id", auth, deletePayslip);

export default router;
