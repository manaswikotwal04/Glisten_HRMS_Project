import express from "express";
import { createAdmin, adminLogin } from "../controllers/admin.controller.js";

console.log("✅ admin.routes.js LOADED");

const router = express.Router();

router.post("/create", createAdmin);
router.post("/login", adminLogin);

export default router;
