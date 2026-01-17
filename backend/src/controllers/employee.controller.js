import db from "../config/db.js";
import bcrypt from "bcryptjs";

/* ================= DATE HELPER ================= */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
};

/* ================= ADD EMPLOYEE ================= */
export const addEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      department,
      role,
      joinDate,
      salary,
      bloodGroup,
      password,
      status,
      currentAddress,
      permanentAddress,
      bankName,
      accountNumber,
      pfNumber,
      panNumber,
      location
    } = req.body;

    if (!employeeId || !name || !password) {
      return res.status(400).json({
        message: "Employee ID, Name and Password are required"
      });
    }

    const [exists] = await db.query(
      "SELECT employeeId FROM employee WHERE employeeId = ? OR email = ?",
      [employeeId, email]
    );

    if (exists.length) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `
      INSERT INTO employee (
        employeeId, name, email, phone, department, role, joinDate, salary,
        bloodGroup, password, status,
        currentAddress, permanentAddress,
        bankName, accountNumber, pfNumber, panNumber, location
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        employeeId,
        name,
        email || null,
        phone || null,
        department || null,
        role || null,
        formatDate(joinDate),
        salary || null,
        bloodGroup || null,
        hashedPassword,
        status || "Active",
        currentAddress || null,
        permanentAddress || null,
        bankName || null,
        accountNumber || null,
        pfNumber || null,
        panNumber || null,
        location || null
      ]
    );

    res.status(201).json({
      message: "Employee added successfully",
      employeeId
    });
  } catch (err) {
    console.error("Add employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL ACTIVE EMPLOYEES ================= */
export const getAllEmployees = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT employeeId, name, department, role, email, status
      FROM employee
      WHERE status = 'Active'
      ORDER BY name
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET INACTIVE EMPLOYEES ================= */
export const getInactiveEmployees = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT employeeId, name, department, role, email, status
      FROM employee
      WHERE status = 'Inactive'
      ORDER BY name
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET EMPLOYEE (BY employeeId) ================= */
/* NOTE: API NAME KEPT SAME => /employee/:id */
export const getEmployeeById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM employee WHERE employeeId = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE EMPLOYEE ================= */
export const updateEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      department,
      role,
      joinDate,
      salary,
      bloodGroup,
      status,
      currentAddress,
      permanentAddress,
      bankName,
      accountNumber,
      pfNumber,
      panNumber,
      location
    } = req.body;

    const [result] = await db.query(
      `
      UPDATE employee SET
        name = ?, email = ?, phone = ?, department = ?, role = ?,
        joinDate = ?, salary = ?, bloodGroup = ?, status = ?,
        currentAddress = ?, permanentAddress = ?,
        bankName = ?, accountNumber = ?, pfNumber = ?, panNumber = ?, location = ?
      WHERE employeeId = ?
      `,
      [
        name || null,
        email || null,
        phone || null,
        department || null,
        role || null,
        formatDate(joinDate),
        salary || null,
        bloodGroup || null,
        status || "Active",
        currentAddress || null,
        permanentAddress || null,
        bankName || null,
        accountNumber || null,
        pfNumber || null,
        panNumber || null,
        location || null,
        req.params.id   // employeeId
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= SOFT DELETE ================= */
export const deleteEmployee = async (req, res) => {
  const [result] = await db.query(
    "UPDATE employee SET status = 'Inactive' WHERE employeeId = ?",
    [req.params.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({ message: "Employee deactivated successfully" });
};

/* ================= RESTORE EMPLOYEE ================= */
export const restoreEmployee = async (req, res) => {
  const [result] = await db.query(
    "UPDATE employee SET status = 'Active' WHERE employeeId = ?",
    [req.params.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({ message: "Employee restored successfully" });
};

/* ================= HARD DELETE (INACTIVE ONLY) ================= */
export const hardDeleteEmployee = async (req, res) => {
  const [result] = await db.query(
    "DELETE FROM employee WHERE employeeId = ? AND status = 'Inactive'",
    [req.params.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({
      message: "Employee not found or still active"
    });
  }

  res.json({ message: "Employee permanently deleted" });
};
/* ================= GET BY EMPLOYEE ID (ALIAS – FRONTEND SAFE) ================= */
export const getEmployeeByEmployeeId = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM employee WHERE employeeId = ?",
      [req.params.employeeId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Get employee by employeeId error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
