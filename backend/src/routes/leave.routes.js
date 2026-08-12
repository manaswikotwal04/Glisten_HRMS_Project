import express from "express";

import {
  applyLeave,
  getAllLeaves,
  updateLeaveStatus,
  getMyLeaves
} from "../controllers/leave.controller.js";

import {
  auth,
  adminAuth
} from "../middleware/auth.middleware.js";

const router = express.Router();


/* ================= EMPLOYEE ================= */

// Apply Leave
router.post(
  "/apply",
  auth,
  applyLeave
);


// My Leaves
router.get(
  "/my-leaves",
  auth,
  getMyLeaves
);


/* ================= ADMIN ================= */

// Get all leaves
router.get(
  "/all",
  adminAuth,
  getAllLeaves
);


// Approve / Reject
router.put(
  "/:id/status",
  adminAuth,
  updateLeaveStatus
);


export default router;