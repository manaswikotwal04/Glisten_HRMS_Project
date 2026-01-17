import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM employee WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const employee = rows[0];

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: employee.id,
        role: "employee",
        employeeId: employee.employeeId 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      role: "employee",
      user: {
        id: employee.id,                 
        employeeId: employee.employeeId, 
        name: employee.name,
        email: employee.email
      }
    });

  } catch (err) {
    console.error("EMPLOYEE LOGIN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
