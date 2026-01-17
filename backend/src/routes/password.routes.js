import express from "express";
import {
  changePassword,
  requestPasswordReset,
  resetPassword
} from "../controllers/password.controller.js";
import { auth } from "../middleware/auth.middleware.js";


const router = express.Router();

// Logged-in user
router.post("/change", auth, changePassword);


// Forgot password
router.post("/request-reset", requestPasswordReset);

// Reset password
router.post("/reset", resetPassword);

export default router;
