import express from "express";

import {
  getMyAttendance,
  markAttendance,
  getAllAttendance
} from "../controllers/attendance.controller.js";

import {
  auth,
  adminAuth
} from "../middleware/auth.middleware.js";


const router = express.Router();


/* =========================================================
   EMPLOYEE
========================================================= */

/*
   Get logged-in employee attendance
*/

router.get(
  "/my",
  auth,
  getMyAttendance
);


/*
   Check / Uncheck attendance
*/

router.post(
  "/mark",
  auth,
  markAttendance
);


/* =========================================================
   ADMIN
========================================================= */

/*
   Admin can ONLY view attendance
*/

router.get(
  "/all",
  adminAuth,
  getAllAttendance
);


export default router;