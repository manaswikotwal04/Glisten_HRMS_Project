import db from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

/* ================= EMAIL CONFIG ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Gmail connection when server starts
transporter
  .verify()
  .then(() => {
    console.log("Gmail SMTP server is ready");
  })
  .catch((error) => {
    console.error("Gmail SMTP error:", error);
  });

/* ================= PASSWORD VALIDATION ================= */

const isStrongPassword = (password) => {
  return (
    password &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&#]/.test(password)
  );
};

const passwordErrorMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

/* ================= CHANGE PASSWORD ================= */

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const employeeId = req.user.employeeId;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required",
      });
    }

    // Validate new password
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: passwordErrorMessage,
      });
    }

    const [[user]] = await db.query(
      "SELECT password FROM employee WHERE employeeId = ?",
      [employeeId]
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(
      oldPassword,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        message: "Old password incorrect",
      });
    }

    // Prevent same password
    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the old password",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE employee SET password = ? WHERE employeeId = ?",
      [hashed, employeeId]
    );

    return res.json({
      message: "Password changed successfully",
    });

  } catch (err) {
    console.error("Change password error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= REQUEST PASSWORD RESET ================= */

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    console.log("Password reset requested for:", email);

    // Check admin first
    const [adminRows] = await db.query(
      "SELECT id FROM admins WHERE email = ?",
      [email]
    );

    const token = crypto.randomBytes(32).toString("hex");

    const expiry = new Date(
      Date.now() + 15 * 60 * 1000
    );

    if (adminRows.length > 0) {
      const admin = adminRows[0];

      // Ensure reset columns exist
      try {
        const [cols] = await db.query(
          `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = ?
           AND TABLE_NAME = 'admins'
           AND COLUMN_NAME IN ('resetToken', 'resetTokenExpiry')`,
          [process.env.DB_NAME]
        );

        const hasResetToken = cols.some(
          (c) => c.COLUMN_NAME === "resetToken"
        );

        const hasResetTokenExpiry = cols.some(
          (c) => c.COLUMN_NAME === "resetTokenExpiry"
        );

        if (!hasResetToken) {
          await db.query(
            "ALTER TABLE admins ADD COLUMN resetToken VARCHAR(255)"
          );
        }

        if (!hasResetTokenExpiry) {
          await db.query(
            "ALTER TABLE admins ADD COLUMN resetTokenExpiry DATETIME"
          );
        }

      } catch (err) {
        console.error(
          "Admin reset column check error:",
          err
        );
      }

      await db.query(
        `UPDATE admins
         SET resetToken = ?, resetTokenExpiry = ?
         WHERE email = ?`,
        [token, expiry, email]
      );

    } else {

      // Check employee
      const [[user]] = await db.query(
        "SELECT employeeId FROM employee WHERE email = ?",
        [email]
      );

      if (!user) {
        return res.status(404).json({
          message: "Email not found",
        });
      }

      await db.query(
        `UPDATE employee
         SET resetToken = ?, resetTokenExpiry = ?
         WHERE email = ?`,
        [token, expiry, email]
      );
    }

    /* ================= CREATE RESET LINK ================= */

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    console.log("Sending reset email to:", email);

    /* ================= SEND EMAIL ================= */

    const info = await transporter.sendMail({
      from: `"Glisten Support" <${process.env.EMAIL_USER}>`,

      to: email,

      replyTo: process.env.EMAIL_USER,

      subject: "Glisten - Reset your password",

      text: `
You requested to reset your Glisten password.

Open the following link to reset your password:

${resetLink}

This link will expire in 15 minutes.

If you did not request this password reset, please ignore this email.
      `,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px;">
          
          <h2>Glisten Password Reset</h2>

          <p>
            You requested to reset your password.
          </p>

          <p>
            Click the button below to create a new password:
          </p>

          <p style="margin: 25px 0;">
            <a
              href="${resetLink}"
              style="
                background: #2563eb;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                text-decoration: none;
                display: inline-block;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            If the button does not work, copy and paste this link into your browser:
          </p>

          <p style="word-break: break-all;">
            ${resetLink}
          </p>

          <p style="font-size: 12px; color: #555;">
            This link will expire in 15 minutes.
          </p>

          <p style="font-size: 12px; color: #555;">
            If you did not request this password reset,
            you can safely ignore this email.
          </p>

        </div>
      `,
    });

    /* ================= EMAIL LOGS ================= */

    console.log("=================================");
    console.log("Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Envelope:", info.envelope);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);
    console.log("=================================");

    return res.json({
      message: "Reset link sent to email",
    });

  } catch (err) {
    console.error("Password reset request error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================= RESET PASSWORD ================= */

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    // Password validation
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    // =====================================
    // FIRST CHECK EMPLOYEE
    // =====================================

    const [[employee]] = await db.query(
      `SELECT employeeId, password
       FROM employee
       WHERE resetToken = ?
       AND resetTokenExpiry > NOW()`,
      [token]
    );

    if (employee) {
      // Check whether new password is same as old password
      const samePassword = await bcrypt.compare(
        newPassword,
        employee.password
      );

      if (samePassword) {
        return res.status(400).json({
          message: "New password cannot be the same as the old password",
        });
      }

      const hashed = await bcrypt.hash(newPassword, 10);

      await db.query(
        `UPDATE employee
         SET password = ?,
             resetToken = NULL,
             resetTokenExpiry = NULL
         WHERE employeeId = ?`,
        [hashed, employee.employeeId]
      );

      return res.json({
        message: "Employee password reset successfully",
      });
    }

    // =====================================
    // THEN CHECK ADMIN
    // =====================================

    const [adminRows] = await db.query(
      `SELECT id, password
       FROM admins
       WHERE resetToken = ?
       AND resetTokenExpiry > NOW()`,
      [token]
    );

    if (adminRows.length > 0) {
      const admin = adminRows[0];

      const samePassword = await bcrypt.compare(
        newPassword,
        admin.password
      );

      if (samePassword) {
        return res.status(400).json({
          message: "New password cannot be the same as the old password",
        });
      }

      const hashed = await bcrypt.hash(newPassword, 10);

      await db.query(
        `UPDATE admins
         SET password = ?,
             resetToken = NULL,
             resetTokenExpiry = NULL
         WHERE id = ?`,
        [hashed, admin.id]
      );

      return res.json({
        message: "Admin password reset successfully",
      });
    }

    return res.status(400).json({
      message: "Invalid or expired reset token",
    });

  } catch (err) {
    console.error("Reset password error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};