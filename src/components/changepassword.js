import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Password validation
  const isStrongPassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[@$!%*?&#]/.test(password)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate new password
    if (!isStrongPassword(newPassword)) {
      alert(
        "Password must be at least 8 characters and include:\n\n" +
          "• One uppercase letter\n" +
          "• One lowercase letter\n" +
          "• One number\n" +
          "• One special character (@$!%*?&#)",
      );
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Optional: Prevent using the old password again
    if (oldPassword === newPassword) {
      alert("New password cannot be the same as the old password");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/password/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to change password");
        return;
      }

      alert("Password changed successfully. Please login again.");

      localStorage.clear();
      navigate("/login");
    } catch (err) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Change Password</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>Old Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p
          style={{
            marginTop: 16,
            cursor: "pointer",
            textAlign: "center",
          }}
          onClick={() => navigate(-1)}
        >
          ← Back
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;
