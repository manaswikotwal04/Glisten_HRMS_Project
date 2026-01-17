import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendResetEmail = async (to, resetLink) => {
  await transporter.sendMail({
    from: `"Glisten Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family:Arial">
        <h2>Password Reset</h2>
        <p>You requested to reset your password.</p>
        <p>
          <a href="${resetLink}"
             style="background:#2563eb;color:#fff;
             padding:10px 15px;text-decoration:none;
             border-radius:5px">
             Reset Password
          </a>
        </p>
        <p>This link expires in 15 minutes.</p>
      </div>
    `
  });
};
