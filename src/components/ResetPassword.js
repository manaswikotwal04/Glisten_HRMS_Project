import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!token) {
      alert("Reset token is missing");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5000/api/password/reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Reset failed");
        return;
      }

      alert("Password reset successful 🎉");
      navigate("/login");

    } catch (err) {
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">

        <h2 className="login-title">Reset Password</h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
          Choose a new password for your account
        </p>

        <form className="login-form" onSubmit={handleReset}>

          {!searchParams.get("token") && (
            <>
              <label>Reset Token</label>
              <input
                placeholder="Paste reset token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </>
          )}

          <label>New Password</label>
          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <span
              className="eye-icon"
              style={{ cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>

          <label>Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button className="login-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p
          style={{
            marginTop: 16,
            fontSize: 14,
            color: "#2563eb",
            cursor: "pointer",
            textAlign: "center"
          }}
          onClick={() => navigate("/login")}
        >
          ← Back to Login
        </p>

      </div>
    </div>
  );
};

export default ResetPassword;
