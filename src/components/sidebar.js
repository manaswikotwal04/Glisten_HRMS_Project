import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  let employeeId = null;

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    employeeId = user?.employeeId || null;
  } catch {
    employeeId = null;
  }

  // ================= LOGO =================
  const glistenImg = new URL("../assets/glisten.png", import.meta.url).href;

  console.log("Logo URL:", glistenImg);

  // Show sidebar only for logged-in users
  if (!role) {
    return null;
  }

  // ================= LOGOUT =================

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) {
      return;
    }

    localStorage.clear();

    navigate("/login", {
      replace: true,
    });
  };

  // ================= HOME PATH =================

  const homePath =
    role === "admin" ? "/app/employees" : "/app/employee-dashboard";

  return (
    <div className="sidebar">
      {/* ================= LOGO ================= */}

      <Link
        to={homePath}
        className="logo-link"
        style={{
          display: "block",
          width: "100%",
          textDecoration: "none",
        }}
      >
        <div
          className="logo"
          style={{
            width: "100%",
            height: "90px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <img
            src={glistenImg}
            alt="Glisten Logo"
            style={{
              width: "180px",
              height: "80px",
              objectFit: "contain",
              display: "block",
            }}
            onLoad={() => {
              console.log("Glisten logo loaded successfully");
            }}
            onError={(e) => {
              console.error("Glisten logo failed:", e.currentTarget.src);
            }}
          />
        </div>
      </Link>

      {/* ================= MENU ================= */}

      <div className="menu">
        {/* ================= ADMIN ================= */}

        {role === "admin" && (
          <>
            <Link to="/app/employees" className="menu-item">
              Employees
            </Link>
            <Link to="/app/employee-hours" className="menu-item">
              Employee Hours
            </Link>
            <Link to="/app/leave-requests" className="menu-item">
              Leave Requests
            </Link>

            <Link to="/app/salary-structure/add" className="menu-item">
              Add Salary Structure
            </Link>

            <Link to="/app/generate-payslip" className="menu-item">
              Generate Payslip
            </Link>

            <Link to="/app/payroll-list" className="menu-item">
              Payroll List
            </Link>

            <button
              type="button"
              className="menu-item logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}

        {/* ================= EMPLOYEE ================= */}

        {role === "employee" && (
          <>
            <Link to="/app/employee-dashboard" className="menu-item">
              Dashboard
            </Link>

            <Link to="/app/apply-leave" className="menu-item">
              Apply Leave
            </Link>

            <Link to="/app/my-leaves" className="menu-item">
              My Leaves
            </Link>
            <Link to="/app/hours-management" className="menu-item">
              Hours Management
            </Link>

            {employeeId && (
              <Link
                to={`/app/employee-payslips/${employeeId}`}
                className="menu-item"
              >
                My Payslips
              </Link>
            )}

            <button
              type="button"
              className="menu-item logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
