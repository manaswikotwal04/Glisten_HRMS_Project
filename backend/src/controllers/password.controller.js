import db from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const employeeId = req.user.employeeId;

    const [[user]] = await db.query(
      "SELECT password FROM employee WHERE employeeId = ?",
      [employeeId]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE employee SET password = ? WHERE employeeId = ?",
      [hashed, employeeId]
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    // First check if email belongs to an admin
    const [adminRows] = await db.query("SELECT id FROM admins WHERE email = ?", [email]);

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    if (adminRows.length > 0) {
      const admin = adminRows[0];

      // Ensure admin table has reset columns (safer check across MySQL versions)
      try {
        const [cols] = await db.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admins'
           AND COLUMN_NAME IN ('resetToken','resetTokenExpiry')`,
          [process.env.DB_NAME]
        );

        const hasResetToken = cols.some((c) => c.COLUMN_NAME === "resetToken");
        const hasResetTokenExpiry = cols.some((c) => c.COLUMN_NAME === "resetTokenExpiry");

        if (!hasResetToken) {
          await db.query("ALTER TABLE admins ADD COLUMN resetToken VARCHAR(255)");
        }
        if (!hasResetTokenExpiry) {
          await db.query("ALTER TABLE admins ADD COLUMN resetTokenExpiry DATETIME");
        }
      } catch (err) {
        // ignore schema-check errors
      }

      await db.query(
        "UPDATE admins SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?",
        [token, expiry, email]
      );

    } else {
      // Fallback to employee table
      const [[user]] = await db.query(
        "SELECT employeeId FROM employee WHERE email = ?",
        [email]
      );

      if (!user) {
        return res.status(404).json({ message: "Email not found" });
      }

      await db.query(
        "UPDATE employee SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?",
        [token, expiry, email]
      );
    }

    /* ===== SEND EMAIL ===== */
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Glisten Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family:Arial;line-height:1.6">
          <h2>Password Reset</h2>
          <p>You requested to reset your password.</p>
          <p>
            <a href="${resetLink}"
               style="background:#2563eb;color:#fff;
               padding:10px 16px;border-radius:6px;
               text-decoration:none">
               Reset Password
            </a>
          </p>
          <p style="font-size:12px;color:#555">
            This link will expire in 15 minutes.
          </p>
        </div>
      `
    });

    res.json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    // Try admins first
    const [adminRows] = await db.query(
      `SELECT id FROM admins WHERE resetToken = ? AND resetTokenExpiry > NOW()`,
      [token]
    );

    if (adminRows.length > 0) {
      const admin = adminRows[0];
      const hashed = await bcrypt.hash(newPassword, 10);

      await db.query(
        `UPDATE admins SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?`,
        [hashed, admin.id]
      );

      return res.json({ message: "Password reset successful" });
    }

    // Fallback to employee
    const [[user]] = await db.query(
      `SELECT employeeId FROM employee
       WHERE resetToken = ? AND resetTokenExpiry > NOW()`,
      [token]
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE employee
       SET password = ?, resetToken = NULL, resetTokenExpiry = NULL
       WHERE employeeId = ?`,
      [hashed, user.employeeId]
    );

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
