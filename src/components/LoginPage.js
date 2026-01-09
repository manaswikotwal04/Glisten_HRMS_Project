import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeDashboard from "./EmployeeDashboard";

const LoginPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: activeTab
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.role);

      alert("Login Success 🎉");

      if (data.role === "admin") {
        navigate("/app/employees");
      } else {
        navigate("/app/employee-dashboard");
      }

    } catch (err) {
      alert("Server Error — backend not reachable");
      console.error(err);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* ⭐ ADDED LOGO ABOVE TITLE ⭐ */}
        {(() => {
          try {
            const imageSrc = new URL("../assets/glisten.png", import.meta.url).href;
            return (
              <img
                src={imageSrc}
                alt="Glisten Software"
                style={{ height: 140, marginBottom: 1 }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            );
          } catch (e) {
            return null;
          }
        })()}

        <h2 className="login-title" style={{marginTop:1}}>Login to Glisten Software Pvt Ltd</h2>

        <div className="login-tabs">
          <button
            className={activeTab === "admin" ? "active" : ""}
            onClick={() => setActiveTab("admin")}
          >
            Admin Login
          </button>

          <button
            className={activeTab === "employee" ? "active" : ""}
            onClick={() => setActiveTab("employee")}
          >
            Employee Login
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label>Email / Username</label>
          <input
            type="text"
            placeholder="john.doe@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label>Password</label>
          <div className="password-box">
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <span className="eye-icon">👁</span>
          </div>

          <div className="remember-forgot">
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>

          <button className="login-btn">Login</button>

          <a href="#" className="guest-link">Continue as Guest</a>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
