import express from "express";

import {
  getMyAttendance,
  markAttendance,
  submitAttendance,
  getAllAttendance,
} from "../controllers/attendance.controller.js";

import {
  auth,
  adminAuth,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================================================
   EMPLOYEE - GET OWN ATTENDANCE
========================================================= */

router.get(
  "/",
  auth,
  getMyAttendance
);

/* =========================================================
   EMPLOYEE - MARK SINGLE DAY
========================================================= */

router.post(
  "/mark",
  auth,
  markAttendance
);

/* =========================================================
   EMPLOYEE - SUBMIT FULL WEEK
========================================================= */

router.post(
  "/submit",
  auth,
  submitAttendance
);

/* =========================================================
   ADMIN - GET ALL ATTENDANCE
========================================================= */

router.get(
  "/all",
  adminAuth,
  getAllAttendance
);

export default router;