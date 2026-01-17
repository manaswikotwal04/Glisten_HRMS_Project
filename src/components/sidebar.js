import React from "react";
import glisten from "../assets/glisten.png";
import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // admin | employee

  let employeeId = null;
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    employeeId = user?.employeeId || null;
  } catch {
    employeeId = null;
  }

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="sidebar">

      {/* LOGO */}
      <div className="logo">
        <img
          src={glisten}
          alt="Glisten Logo"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </div>

      {/* MENU */}
      <div className="menu">

      
        {role === "admin" && (
          <>
            <Link to="/app/employees" className="menu-item">
              Employees
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

      
        {role === "employee" && (
          <>
            <Link to="/app/employee-dashboard" className="menu-item">
              Dashboard
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
