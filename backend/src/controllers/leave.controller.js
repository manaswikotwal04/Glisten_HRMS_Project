import db from "../config/db.js";
import transporter from "../config/mailer.js";

/* =====================================================
   APPLY LEAVE - EMPLOYEE
   POST /api/leave/apply
===================================================== */

export const applyLeave = async (req, res) => {
  try {
    // Employee ID comes from JWT
    const employeeId = req.user.employeeId;

    const { leaveType, fromDate, toDate, numberOfDays, reason } = req.body;

    /* ================= REQUIRED FIELD VALIDATION ================= */

    if (!leaveType || !fromDate || !toDate || !numberOfDays || !reason) {
      return res.status(400).json({
        message: "All leave fields are required",
      });
    }

    /* ================= LEAVE TYPE VALIDATION ================= */

    if (typeof leaveType !== "string" || leaveType.trim().length === 0) {
      return res.status(400).json({
        message: "Invalid leave type",
      });
    }

    /* ================= REASON VALIDATION ================= */

    if (typeof reason !== "string" || reason.trim().length < 3) {
      return res.status(400).json({
        message: "Reason must contain at least 3 characters",
      });
    }

    /* ================= NUMBER OF DAYS VALIDATION ================= */

    const leaveDays = Number(numberOfDays);

    if (!Number.isFinite(leaveDays) || leaveDays <= 0) {
      return res.status(400).json({
        message: "Number of days must be greater than 0",
      });
    }

    /* ================= DATE VALIDATION ================= */

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date",
      });
    }

    /*
      Normalize dates to midnight.

      This prevents time-zone/time-of-day differences
      from affecting the comparison.
    */

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* ================= PAST DATE VALIDATION ================= */

    if (startDate < today) {
      return res.status(400).json({
        message: "Cannot apply for leave on a past date",
      });
    }

    /* ================= DATE RANGE VALIDATION ================= */

    if (endDate < startDate) {
      return res.status(400).json({
        message: "To date cannot be before From date",
      });
    }

    /* ================= CALCULATE ACTUAL DAYS ================= */

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const actualNumberOfDays =
      Math.round((endDate - startDate) / millisecondsPerDay) + 1;

    /*
      The submitted numberOfDays must match
      the selected From Date and To Date.

      Example:
      From: 26 Aug
      To:   28 Aug

      Actual days = 3
    */

    if (leaveDays !== actualNumberOfDays) {
      return res.status(400).json({
        message: `Number of days does not match the selected dates. Expected ${actualNumberOfDays} day(s)`,
      });
    }

    /* ================= CHECK EMPLOYEE ================= */

    const [employee] = await db.query(
      `
      SELECT employeeId, name, status
      FROM employee
      WHERE employeeId = ?
      `,
      [employeeId],
    );

    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    /*
      Optional protection:
      Inactive employees should not be able
      to apply for new leave.

      Uncomment if your status values are
      exactly 'Active' and 'Inactive'.

    if (employee[0].status !== "Active") {
      return res.status(403).json({
        message: "Inactive employee cannot apply for leave"
      });
    }
    */

    /* ================= CHECK OVERLAPPING LEAVE ================= */

    const [existingLeave] = await db.query(
      `
      SELECT id
      FROM leave_requests
      WHERE employeeId = ?
      AND status IN ('Pending', 'Approved')
      AND fromDate <= ?
      AND toDate >= ?
      `,
      [employeeId, toDate, fromDate],
    );

    if (existingLeave.length > 0) {
      return res.status(400).json({
        message:
          "You already have a pending or approved leave request for these dates",
      });
    }

    /* ================= INSERT LEAVE ================= */

    await db.query(
      `
      INSERT INTO leave_requests
      (
        employeeId,
        leaveType,
        fromDate,
        toDate,
        numberOfDays,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
      `,
      [
        employeeId,
        leaveType.trim(),
        fromDate,
        toDate,
        leaveDays,
        reason.trim(),
      ],
    );

    /* ================= SEND EMAIL TO ADMIN ================= */

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL,

        subject: `New Leave Request - ${employee[0].name}`,

        text: `
A new leave request has been submitted.

Employee Name: ${employee[0].name}
Employee ID: ${employeeId}

Leave Type: ${leaveType.trim()}
From Date: ${fromDate}
To Date: ${toDate}
Number of Days: ${leaveDays}

Reason:
${reason.trim()}

Status: Pending

Please log in to the HRMS Admin Panel to review the leave request.
        `,
      });

      console.log(
        `Leave notification email sent successfully for employee: ${employee[0].name}`,
      );
    } catch (emailError) {
      /*
        Leave is already saved successfully.

        We only log the email error so that
        SMTP problems do not cancel the leave request.
      */

      console.error("LEAVE NOTIFICATION EMAIL ERROR:", emailError);
    }

    /* ================= SUCCESS ================= */

    return res.status(201).json({
      message: "Leave applied successfully",
      status: "Pending",
    });
  } catch (error) {
    console.error("APPLY LEAVE ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =====================================================
   GET ALL LEAVES - ADMIN
   GET /api/leave/all
===================================================== */

export const getAllLeaves = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        l.id,
        l.employeeId,
        e.name AS employeeName,
        l.leaveType,
        l.fromDate,
        l.toDate,
        l.numberOfDays,
        l.reason,
        l.status,
        l.appliedOn

      FROM leave_requests l

      JOIN employee e
        ON e.employeeId = l.employeeId

      ORDER BY l.appliedOn DESC
      `,
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("GET ALL LEAVES ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =====================================================
   UPDATE LEAVE STATUS - ADMIN
   PUT /api/leave/:id/status
===================================================== */

/* =====================================================
   UPDATE LEAVE STATUS - ADMIN
   PUT /api/leave/:id/status
===================================================== */

export const updateLeaveStatus = async (req, res) => {

  let connection;

  try {

    const { id } = req.params;
    const { status } = req.body;


    /* ================= STATUS VALIDATION ================= */

    if (!["Approved", "Rejected"].includes(status)) {

      return res.status(400).json({
        message:
          "Invalid leave status",
      });
    }


    /* ================= GET LEAVE ================= */

    const [leaveRows] = await db.query(
      `
      SELECT
        id,
        employeeId,
        leaveType,
        fromDate,
        toDate,
        status
      FROM leave_requests
      WHERE id = ?
      `,
      [id]
    );


    if (leaveRows.length === 0) {

      return res.status(404).json({
        message:
          "Leave request not found",
      });
    }


    const leave =
      leaveRows[0];


    /* ================= PREVENT REPROCESSING ================= */

    if (
      leave.status === "Approved" ||
      leave.status === "Rejected"
    ) {

      return res.status(400).json({
        message:
          "This leave request has already been processed",
      });
    }


    /* =====================================================
       CHECK WORK FROM HOME
    ===================================================== */

    const leaveType =
      String(
        leave.leaveType || ""
      )
        .trim()
        .toLowerCase();


    const isWorkFromHome =
      leaveType === "work from home" ||
      leaveType === "work-from-home" ||
      leaveType === "wfh";


    /* =====================================================
       START TRANSACTION
    ===================================================== */

    connection =
      await db.getConnection();

    await connection.beginTransaction();


    /* ================= UPDATE STATUS ================= */

    await connection.query(
      `
      UPDATE leave_requests
      SET status = ?
      WHERE id = ?
      `,
      [
        status,
        id,
      ]
    );


    /* =====================================================
       IF APPROVED AND NOT WFH:

       Remove attendance records for the leave dates.

       WFH DOES NOT remove attendance.
    ===================================================== */

    if (
      status === "Approved" &&
      !isWorkFromHome
    ) {

      await connection.query(
        `
        DELETE FROM attendance
        WHERE employeeId = ?
          AND attendanceDate BETWEEN ? AND ?
        `,
        [
          leave.employeeId,
          leave.fromDate,
          leave.toDate,
        ]
      );
    }


    await connection.commit();


    return res.status(200).json({

      message:
        `Leave ${status.toLowerCase()} successfully`,

      status,

      attendanceLocked:
        status === "Approved" &&
        !isWorkFromHome,

      workFromHome:
        isWorkFromHome,

    });

  } catch (error) {

    if (connection) {

      try {
        await connection.rollback();
      } catch (rollbackError) {

        console.error(
          "ROLLBACK ERROR:",
          rollbackError
        );
      }
    }


    console.error(
      "UPDATE LEAVE STATUS ERROR:",
      error
    );


    return res.status(500).json({
      message:
        "Server error",
    });

  } finally {

    if (connection) {
      connection.release();
    }
  }
};

/* =====================================================
   GET MY LEAVES - EMPLOYEE
   GET /api/leave/my-leaves
===================================================== */

export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const [rows] = await db.query(
      `
      SELECT
        id,
        employeeId,
        leaveType,
        fromDate,
        toDate,
        numberOfDays,
        reason,
        status,
        appliedOn

      FROM leave_requests

      WHERE employeeId = ?

      ORDER BY appliedOn DESC
      `,
      [employeeId],
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("GET MY LEAVES ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
