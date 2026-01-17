import express from "express";
import { addSalaryStructure } from "../controllers/salary.controller.js";

const router = express.Router();


router.post("/structure", addSalaryStructure);


export default router;
