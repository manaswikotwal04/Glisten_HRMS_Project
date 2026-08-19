import db from "../config/db.js";

/* =====================================================
   APPLY LEAVE - EMPLOYEE
   POST /api/leave/apply
===================================================== */

export const applyLeave = async (req, res) => {
  try {
    // Employee ID comes from JWT
    const employeeId = req.user.employeeId;

    const {
      leaveType,
      fromDate,
      toDate,
      numberOfDays,
      reason
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !leaveType ||
      !fromDate ||
      !toDate ||
      !numberOfDays ||
      !reason
    ) {
      return res.status(400).json({
        message: "All leave fields are required"
      });
    }

    /* ================= DATE VALIDATION ================= */

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid date"
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        message: "To date cannot be before From date"
      });
    }

    /* ================= CHECK EMPLOYEE ================= */

    const [employee] = await db.query(
      `
      SELECT employeeId, name, status
      FROM employee
      WHERE employeeId = ?
      `,
      [employeeId]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

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
      [
        employeeId,
        toDate,
        fromDate
      ]
    );

    if (existingLeave.length > 0) {
      return res.status(400).json({
        message: "You already have a leave request for these dates"
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
        leaveType,
        fromDate,
        toDate,
        numberOfDays,
        reason
      ]
    );

    /* ================= SUCCESS ================= */

    res.status(201).json({
      message: "Leave applied successfully",
      status: "Pending"
    });

  } catch (error) {
    console.error(
      "APPLY LEAVE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error"
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
      `
    );

    res.status(200).json(rows);

  } catch (error) {

    console.error(
      "GET ALL LEAVES ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
/* =====================================================
   UPDATE LEAVE STATUS - ADMIN
   PUT /api/leave/:id/status
===================================================== */

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Only these two statuses are allowed
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid leave status"
      });
    }

    // Check whether leave exists
    const [leave] = await db.query(
      `
      SELECT id, status
      FROM leave_requests
      WHERE id = ?
      `,
      [id]
    );

    if (leave.length === 0) {
      return res.status(404).json({
        message: "Leave request not found"
      });
    }

    // Don't allow changing an already processed request
    if (
      leave[0].status === "Approved" ||
      leave[0].status === "Rejected"
    ) {
      return res.status(400).json({
        message: "This leave request has already been processed"
      });
    }

    // Update status
    await db.query(
      `
      UPDATE leave_requests
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    res.status(200).json({
      message: `Leave ${status.toLowerCase()} successfully`,
      status
    });

  } catch (error) {
    console.error(
      "UPDATE LEAVE STATUS ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
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
      [employeeId]
    );

    res.status(200).json(rows);

  } catch (error) {
    console.error("GET MY LEAVES ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};
