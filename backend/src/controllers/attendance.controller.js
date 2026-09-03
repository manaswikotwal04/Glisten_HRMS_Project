import db from "../config/db.js";

/* =========================================================
   HELPER - CHECK IF LEAVE TYPE IS WORK FROM HOME
========================================================= */

const isWorkFromHomeLeave = (leaveType) => {
  if (!leaveType) return false;

  const type = String(leaveType).trim().toLowerCase();

  return (
    type === "work from home" ||
    type === "work-from-home" ||
    type === "wfh"
  );
};


/* =========================================================
   HELPER - GET APPROVED LEAVE DATES
   Only actual leave locks attendance.
   Work From Home does NOT lock attendance.
========================================================= */

const getApprovedLeaveDates = async (
  employeeId,
  dates
) => {
  if (!Array.isArray(dates) || dates.length === 0) {
    return new Set();
  }

  const placeholders = dates.map(() => "?").join(",");

  const [rows] = await db.query(
    `
    SELECT
      fromDate,
      toDate,
      leaveType
    FROM leave_requests
    WHERE employeeId = ?
      AND status = 'Approved'
      AND fromDate <= ?
      AND toDate >= ?
    `,
    [
      employeeId,
      dates[dates.length - 1],
      dates[0],
    ]
  );

  const lockedDates = new Set();

  for (const leave of rows) {

    /* -----------------------------------------
       WORK FROM HOME DOES NOT LOCK ATTENDANCE
    ----------------------------------------- */

    if (isWorkFromHomeLeave(leave.leaveType)) {
      continue;
    }

    const start = new Date(leave.fromDate);
    const end = new Date(leave.toDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    for (const dateString of dates) {

      const current = new Date(dateString);
      current.setHours(0, 0, 0, 0);

      if (
        current >= start &&
        current <= end
      ) {
        lockedDates.add(dateString);
      }
    }
  }

  return lockedDates;
};


/* =========================================================
   EMPLOYEE - GET OWN ATTENDANCE

   GET /api/attendance?year=2026&month=9&week=36
========================================================= */

export const getMyAttendance = async (req, res) => {

  try {

    const employeeId = req.user.employeeId;

    const {
      year,
      month,
      week,
    } = req.query;

    let sql = `
      SELECT
        a.id,
        a.employeeId,
        DATE_FORMAT(a.attendanceDate, '%Y-%m-%d') AS attendanceDate,
        a.worked,
        a.hours,

        CASE
          WHEN EXISTS (
            SELECT 1
            FROM leave_requests l
            WHERE l.employeeId = a.employeeId
              AND l.status = 'Approved'
              AND l.fromDate <= DATE(a.attendanceDate)
              AND l.toDate >= DATE(a.attendanceDate)
              AND LOWER(TRIM(l.leaveType))
                  NOT IN (
                    'work from home',
                    'work-from-home',
                    'wfh'
                  )
          )
          THEN 1
          ELSE 0
        END AS leaveLocked,

        (
          SELECT l.leaveType
          FROM leave_requests l
          WHERE l.employeeId = a.employeeId
            AND l.status = 'Approved'
            AND l.fromDate <= DATE(a.attendanceDate)
            AND l.toDate >= DATE(a.attendanceDate)
            AND LOWER(TRIM(l.leaveType))
                NOT IN (
                  'work from home',
                  'work-from-home',
                  'wfh'
                )
          ORDER BY l.id DESC
          LIMIT 1
        ) AS leaveType

      FROM attendance a

      WHERE a.employeeId = ?
    `;

    const params = [employeeId];


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
      ORDER BY a.attendanceDate ASC
    `;


    const [rows] = await db.query(
      sql,
      params
    );


    /*
      Convert values coming from MySQL
      into proper frontend values.
    */

    const formattedRows = rows.map((row) => ({
      ...row,

      worked:
        Boolean(row.worked),

      hours:
        Number(row.hours || 0),

      leaveLocked:
        Boolean(row.leaveLocked),

      leaveType:
        row.leaveType || null,
    }));


    return res.status(200).json(
      formattedRows
    );

  } catch (error) {

    console.error(
      "GET MY ATTENDANCE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch attendance",

      error:
        error.message,
    });
  }
};


/* =========================================================
   EMPLOYEE - MARK SINGLE ATTENDANCE

   POST /api/attendance
========================================================= */

export const markAttendance = async (
  req,
  res
) => {

  try {

    const employeeId =
      req.user.employeeId;

    const {
      attendanceDate,
      worked,
      hours,
    } = req.body;


    if (!attendanceDate) {

      return res.status(400).json({
        message:
          "Attendance date is required",
      });
    }


    /* =====================================================
       CHECK APPROVED LEAVE

       Work From Home is intentionally excluded.
    ===================================================== */

    const [leaveRows] = await db.query(
      `
      SELECT
        leaveType
      FROM leave_requests
      WHERE employeeId = ?
        AND status = 'Approved'
        AND fromDate <= ?
        AND toDate >= ?
      LIMIT 1
      `,
      [
        employeeId,
        attendanceDate,
        attendanceDate,
      ]
    );


    if (
      leaveRows.length > 0 &&
      !isWorkFromHomeLeave(
        leaveRows[0].leaveType
      )
    ) {

      return res.status(400).json({
        message:
          `Attendance is locked because ${leaveRows[0].leaveType} is approved for this date.`,
        leaveLocked: true,
        leaveType:
          leaveRows[0].leaveType,
      });
    }


    const isWorked =
      worked === true ||
      worked === 1 ||
      worked === "1" ||
      worked === "true";


    let finalHours = 0;


    if (isWorked) {

      finalHours =
        hours === undefined ||
        hours === null ||
        hours === ""
          ? 8
          : Number(hours);


      if (
        Number.isNaN(finalHours) ||
        finalHours < 0 ||
        finalHours > 24
      ) {

        return res.status(400).json({
          message:
            "Hours must be between 0 and 24",
        });
      }
    }


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
        isWorked ? 1 : 0,
        finalHours,
      ]
    );


    return res.status(200).json({

      message:
        "Attendance updated successfully",

      employeeId,

      attendanceDate,

      worked:
        isWorked,

      hours:
        finalHours,

    });

  } catch (error) {

    console.error(
      "MARK ATTENDANCE ERROR:",
      error
    );

    return res.status(500).json({

      message:
        "Failed to update attendance",

      error:
        error.message,

    });
  }
};


/* =========================================================
   EMPLOYEE - SUBMIT COMPLETE WEEK

   POST /api/attendance/submit
========================================================= */

export const submitAttendance = async (
  req,
  res
) => {

  let connection;

  try {

    const employeeId =
      req.user.employeeId;

    const {
      year,
      month,
      week,
      days,
    } = req.body;


    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!employeeId) {

      return res.status(401).json({
        message:
          "Employee ID not found in token",
      });
    }


    if (!Array.isArray(days)) {

      return res.status(400).json({
        message:
          "Attendance days are required",
      });
    }


    if (days.length === 0) {

      return res.status(400).json({
        message:
          "No attendance days to submit",
      });
    }


    /* =====================================================
       REMOVE DUPLICATE DATES FROM PAYLOAD

       This also protects against accidentally submitting
       the same date multiple times.
    ===================================================== */

    const uniqueDates = [
      ...new Set(
        days.map((day) => day.date)
      ),
    ];


    /* =====================================================
       CHECK APPROVED LEAVES BEFORE SAVING ANYTHING
    ===================================================== */

    const lockedDates =
      await getApprovedLeaveDates(
        employeeId,
        uniqueDates
      );


    /*
      If any submitted day is an approved leave day,
      stop the complete transaction.
    */

    const lockedDay =
      days.find((day) =>
        lockedDates.has(day.date)
      );


    if (lockedDay) {

      return res.status(400).json({

        message:
          `Attendance cannot be submitted for ${lockedDay.date} because it is an approved leave date.`,

        leaveLocked: true,

        date:
          lockedDay.date,

      });
    }


    /* =====================================================
       VALIDATE EVERY DAY
    ===================================================== */

    for (const day of days) {

      if (!day.date) {

        return res.status(400).json({
          message:
            "Attendance date is required",
        });
      }


      const worked =
        day.worked === true ||
        day.worked === 1 ||
        day.worked === "1" ||
        day.worked === "true";


      const hours =
        worked
          ? Number(day.hours || 0)
          : 0;


      if (
        Number.isNaN(hours) ||
        hours < 0 ||
        hours > 24
      ) {

        return res.status(400).json({

          message:
            `Invalid hours for ${day.date}. Hours must be between 0 and 24.`,

        });
      }
    }


    /* =====================================================
       DATABASE CONNECTION
    ===================================================== */

    connection =
      await db.getConnection();


    await connection.beginTransaction();


    /* =====================================================
       SAVE EVERY DAY

       IMPORTANT:
       Do NOT use days.length - 1.
    ===================================================== */

    for (const day of days) {

      const worked =
        day.worked === true ||
        day.worked === 1 ||
        day.worked === "1" ||
        day.worked === "true";


      const hours =
        worked
          ? Number(day.hours || 0)
          : 0;


      await connection.query(
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
          day.date,
          worked ? 1 : 0,
          hours,
        ]
      );
    }


    await connection.commit();


    return res.status(200).json({

      message:
        "Attendance submitted successfully",

      employeeId,

      year:
        Number(year),

      month:
        Number(month),

      week:
        Number(week),

      daysSubmitted:
        days.length,

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
      "SUBMIT ATTENDANCE ERROR:",
      error
    );


    return res.status(500).json({

      message:
        "Failed to submit attendance",

      error:
        error.message,

    });

  } finally {

    if (connection) {
      connection.release();
    }
  }
};


/* =========================================================
   ADMIN - GET ALL ATTENDANCE
========================================================= */

export const getAllAttendance = async (
  req,
  res
) => {

  try {

    const {
      employeeId,
      year,
      month,
      week,
    } = req.query;


    let sql = `
      SELECT
        a.id,
        a.employeeId,
        e.name AS employeeName,
        DATE_FORMAT(a.attendanceDate, '%Y-%m-%d') AS attendanceDate,
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

      params.push(
        Number(year)
      );
    }


    /* ================= MONTH ================= */

    if (
      month &&
      month !== "all"
    ) {

      sql += `
        AND MONTH(a.attendanceDate) = ?
      `;

      params.push(
        Number(month)
      );
    }


    /* ================= WEEK ================= */

    if (
      week &&
      week !== "all"
    ) {

      sql += `
        AND WEEK(a.attendanceDate, 1) = ?
      `;

      params.push(
        Number(week)
      );
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


    return res.status(200).json(
      rows
    );

  } catch (error) {

    console.error(
      "GET ALL ATTENDANCE ERROR:",
      error
    );


    return res.status(500).json({

      message:
        "Failed to fetch attendance",

      error:
        error.message,

    });
  }
};