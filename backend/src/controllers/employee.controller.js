import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import User from "../models/user.model.js";

/* =========================================================
   CREATE EMPLOYEE (Admin action)
========================================================= */
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      employeeId,
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
      accountNo,
      pfNo,
      pan,
      location
    } = req.body;

    // ✅ Validate required fields
    if (!name || !employeeId || !email) {
      return res.status(400).json({
        message: "Name, Employee ID and Email are required"
      });
    }

    // ✅ Check duplicate employeeId
    const empIdExists = await Employee.findOne({ employeeId });
    if (empIdExists) {
      return res.status(400).json({
        message: "Employee ID already exists"
      });
    }

    // ✅ Check duplicate email
    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "Employee email already exists"
      });
    }

    // ✅ Temporary password
    const tempPassword = "Welcome@123";
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // ✅ Create employee record
    const employee = await Employee.create({
      name,
      employeeId,
      email,
      phone,
      department,
      role,
      joinDate,
      salary,
      bloodGroup,
      status: status || "Active",
      password: hashedPassword,
      currentAddress,
      permanentAddress,
      bankName,
      accountNo,
      pfNo,
      pan,
      location
    });

    // ✅ Create auth user record
    await User.create({
      name,
      email,
      tempPassword: hashedPassword,
      role: "employee",
      firstLogin: true
    });

    return res.status(201).json({
      message: "Employee created successfully",
      tempPassword,
      employee
    });

  } catch (err) {
    console.error("Create employee error:", err);

    // ✅ Handle MySQL unique constraint error
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Employee ID or Email already exists"
      });
    }

    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   GET ALL EMPLOYEES
========================================================= */
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   GET EMPLOYEE BY UUID (_id)
========================================================= */
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   UPDATE EMPLOYEE
========================================================= */
export const updateEmployee = async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body
    );

    if (!updated)
      return res.status(404).json({ message: "Employee not found" });

    res.json({
      message: "Employee updated successfully",
      employee: updated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   DELETE EMPLOYEE (SAFE)
========================================================= */
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // ✅ Delete employee
    await Employee.findByIdAndDelete(req.params.id);

    // ✅ Delete auth user (if exists)
    const user = await User.findOne({ email: employee.email });
    if (user) {
      await User.findByIdAndUpdate(user._id, { deleted: true });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   CHANGE EMPLOYEE PASSWORD (BY UUID)
========================================================= */
export const changeEmployeePassword = async (req, res) => {
  try {
    const { employeeUuid, newPassword } = req.body;

    if (!employeeUuid || !newPassword) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    const employee = await Employee.findByIdAndUpdate(employeeUuid, {
      password: hash
    });

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    await User.findOneAndUpdate(
      { email: employee.email },
      {
        password: hash,
        tempPassword: null,
        firstLogin: false
      }
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
