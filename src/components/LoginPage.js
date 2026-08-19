import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const url =
      activeTab === "admin"
        ? "/api/admin/login"
        : "/api/employee-auth/login";
        

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        console.warn(data.message || "Login failed");
        return;
      }

      // ✅ normalize role
      const role = data.role?.toLowerCase();

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", role);

      console.warn("Login Success 🎉");

      if (role === "admin") {
        navigate("/app/employees", { replace: true });
      } else if (role === "employee") {
        navigate("/app/employee-dashboard", { replace: true });
      } else {
        console.warn("Invalid role received from server");
      }

    } catch (err) {
      console.error(err);
      console.warn("Server error — backend not reachable");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* Logo */}
        {(() => {
          try {
            const imageSrc = new URL("../assets/glisten.png", import.meta.url).href;
            return (
              <img
                src={imageSrc}
                alt="Glisten Software"
                style={{ height: 140, marginBottom: 10 }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            );
          } catch {
            return null;
          }
        })()}

        <h2 className="login-title">
          Login to Glisten Software Pvt Ltd
        </h2>

      
        <div className="login-tabs">
          <button
            type="button"
            className={activeTab === "admin" ? "active" : ""}
            onClick={() => setActiveTab("admin")}
          >
            Admin Login
          </button>

          <button
            type="button"
            className={activeTab === "employee" ? "active" : ""}
            onClick={() => setActiveTab("employee")}
          >
            Employee Login
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            placeholder="john.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
             <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "35%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: 0
    }}
  >
    {showPassword ? "👁️" : "👁️‍🗨️"}
  </button>
            
          </div>

      
          <p
            style={{
              textAlign: "right",
              marginTop: 6,
              cursor: "pointer",
              color: "#2563eb",
              fontSize: 14
            }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </p>

          <button className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;



