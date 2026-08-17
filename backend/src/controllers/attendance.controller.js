import db from "../config/db.js";

/* =========================================================
   EMPLOYEE - GET OWN ATTENDANCE
========================================================= */

export const getMyAttendance = async (req, res) => {
  try {

    const employeeId = req.user.employeeId;

    const {
      year,
      month,
      week
    } = req.query;

    let sql = `
      SELECT
        id,
        employeeId,
        attendanceDate,
        worked,
        hours
      FROM attendance
      WHERE employeeId = ?
    `;

    const params = [employeeId];


    /* ================= YEAR ================= */

    if (year) {
      sql += `
        AND YEAR(attendanceDate) = ?
      `;

      params.push(Number(year));
    }


    /* ================= MONTH ================= */

    if (month && month !== "all") {
      sql += `
        AND MONTH(attendanceDate) = ?
      `;

      params.push(Number(month));
    }


    /* ================= WEEK ================= */

    if (week && week !== "all") {
      sql += `
        AND WEEK(attendanceDate, 1) = ?
      `;

      params.push(Number(week));
    }


    sql += `
      ORDER BY attendanceDate ASC
    `;


    const [rows] =
      await db.query(
        sql,
        params
      );


    res.status(200).json(rows);

  } catch (error) {

    console.error(
      "GET MY ATTENDANCE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch attendance"
    });
  }
};


/* =========================================================
   EMPLOYEE - MARK / UPDATE ATTENDANCE
========================================================= */

export const markAttendance = async (req, res) => {
  try {

    const employeeId =
      req.user.employeeId;

    const {
      attendanceDate,
      worked
    } = req.body;


    if (!attendanceDate) {
      return res.status(400).json({
        message:
          "Attendance date is required"
      });
    }


    const isWorked =
      worked === true ||
      worked === 1 ||
      worked === "true";


    /*
      Checked     = 8 hours
      Unchecked   = 0 hours
    */

    const hours =
      isWorked ? 8 : 0;


    await db.query(
      `
      INSERT INTO attendance
      (
        employeeId,
        attendanceDate,
        worked,
        hours
      )
      VALUES (?, ?, ?, ?)

      ON DUPLICATE KEY UPDATE
        worked = VALUES(worked),
        hours = VALUES(hours)
      `,
      [
        employeeId,
        attendanceDate,
        isWorked,
        hours
      ]
    );


    res.status(200).json({
      message:
        "Attendance updated successfully",

      employeeId,

      attendanceDate,

      worked:
        isWorked,

      hours
    });

  } catch (error) {

    console.error(
      "MARK ATTENDANCE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update attendance"
    });
  }
};


/* =========================================================
   ADMIN - GET ALL ATTENDANCE
========================================================= */

export const getAllAttendance = async (req, res) => {
  try {

    const {
      employeeId,
      year,
      month,
      week
    } = req.query;


    let sql = `
      SELECT
        a.id,
        a.employeeId,
        e.name AS employeeName,
        a.attendanceDate,
        a.worked,
        a.hours
      FROM attendance a
      JOIN employee e
        ON e.employeeId = a.employeeId
      WHERE 1 = 1
    `;


    const params = [];


    /* ================= EMPLOYEE ================= */

    if (employeeId) {

      sql += `
        AND a.employeeId = ?
      `;

      params.push(employeeId);
    }


    /* ================= YEAR ================= */

    if (year) {

      sql += `
        AND YEAR(a.attendanceDate) = ?
      `;

      params.push(Number(year));
    }


    /* ================= MONTH ================= */

    if (
      month &&
      month !== "all"
    ) {

      sql += `
        AND MONTH(a.attendanceDate) = ?
      `;

      params.push(Number(month));
    }


    /* ================= WEEK ================= */

    if (
      week &&
      week !== "all"
    ) {

      sql += `
        AND WEEK(a.attendanceDate, 1) = ?
      `;

      params.push(Number(week));
    }


    sql += `
      ORDER BY
        a.attendanceDate ASC,
        a.employeeId ASC
    `;


    const [rows] =
      await db.query(
        sql,
        params
      );


    res.status(200).json(rows);

  } catch (error) {

    console.error(
      "GET ALL ATTENDANCE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch attendance"
    });
  }
};