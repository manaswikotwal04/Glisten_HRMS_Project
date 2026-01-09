import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const role = localStorage.getItem("role");

    if (!user || role !== "employee") {
      alert("Unauthorized access");
      navigate("/");
      return;
    }

    setEmployee(user);
  }, []);

  if (!employee) return null;

  const openPayslips = () => {
    navigate(`/app/employee-payslips/${employee._id}`);
  };

  return (
    <div className="employee-page">

      <h2 className="page-title">
        Welcome, {employee.name || "Employee"}
      </h2>

      <div className="employee-card">

        <h3 className="section-title">Employee Dashboard</h3>

        <div className="dashboard-grid">

          <div className="dash-box">
            <h4>Employee ID</h4>
            <p>{employee.employeeId}</p>
          </div>

          <div className="dash-box">
            <h4>Department</h4>
            <p>{employee.department || "—"}</p>
          </div>

          <div className="dash-box">
            <h4>Role</h4>
            <p>{employee.role || "—"}</p>
          </div>

          <div className="dash-box">
            <h4>Email</h4>
            <p>{employee.email}</p>
          </div>
        </div>

        <div className="dashboard-actions">

          {/* VIEW PROFILE */}
          <button
            className="add-btn"
            onClick={() => navigate(`/app/employee-payslips/${employee._id}`)}
          >
            View Profile
          </button>

          {/* EMPLOYEE PAYSLIPS */}
          <button
            className="add-btn"
            onClick={openPayslips}
          >
            Payslips
          </button>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
