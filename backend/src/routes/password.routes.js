import express from "express";
import {
  changePassword,
  requestPasswordReset,
  resetPassword
} from "../controllers/password.controller.js";
import { auth } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/change", auth, changePassword);


router.post("/request-reset", requestPasswordReset);

router.post("/reset", resetPassword);

export default router;
