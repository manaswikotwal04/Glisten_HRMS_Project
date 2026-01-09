import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeSettings = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New password & confirm password do not match");
      return;
    }

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/auth/reset-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: user._id,
        oldPassword,
        newPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Password update failed");
      return;
    }

    alert("Password updated successfully ✔");
    navigate("/app/employee-dashboard");
  };

  return (
    <div className="employee-page">
      <h2 className="page-title">Account Settings</h2>

      <div className="employee-card">
        <h3 className="section-title">Reset Password</h3>

        <label>Old Password</label>
        <input
          type="password"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
        />

        <label>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        <button className="add-btn" onClick={resetPassword}>
          Update Password
        </button>
      </div>
    </div>
  );
};

export default EmployeeSettings;
