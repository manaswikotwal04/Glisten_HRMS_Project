import express from "express";
import { employeeLogin } from "../controllers/employeeAuth.controller.js";

const router = express.Router();


router.post("/login", employeeLogin);

export default router;
