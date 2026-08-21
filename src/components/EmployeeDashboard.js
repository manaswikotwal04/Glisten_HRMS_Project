import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleResetPassword = () => {
    // simple reset flow (old → new password page)
    navigate("/app/change-password");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    let user;
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch {
      user = null;
    }

    if (!user || role?.toLowerCase() !== "employee" || !token) {
      alert("Unauthorized access");
      handleLogout();
      return;
    }

    if (!user.employeeId) {
      alert("Employee ID missing. Please login again.");
      handleLogout();
      return;
    }

    fetch(`/api/employee/id/${user.employeeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch employee");
        return res.json();
      })
      .then((data) => setEmployee(data))
      .catch((err) => {
        console.error("Employee fetch error:", err);
        alert("Session expired. Please login again.");
        handleLogout();
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  if (!employee) return null;

  const openPayslips = () => {
    navigate(`/app/employee-payslips/${employee.employeeId}`);
  };

  return (
    <div className="employee-page">
      <h2 className="page-title">Welcome, {employee.name || "Employee"}</h2>

      <div className="employee-card">
        {!showProfile ? (
          <>
            {/* ================= DASHBOARD VIEW ================= */}
            <h3 className="section-title">Employee Dashboard</h3>

            <div className="dashboard-grid">
              <DashBox title="Employee ID" value={employee.employeeId} />
              <DashBox title="Department" value={employee.department || "—"} />
              <DashBox title="Role" value="Employee" />
              <DashBox title="Email" value={employee.email || "—"} />
            </div>

            <div className="dashboard-actions">
              <button className="add-btn" onClick={() => setShowProfile(true)}>
                View Profile
              </button>
              <button
                className="add-btn"
                onClick={() => navigate("/app/apply-leave")}
              >
                Apply Leave
              </button>
              <button
                className="add-btn"
                onClick={() => navigate("/app/my-leaves")}
              >
                My Leaves
              </button>

              <button className="add-btn" onClick={openPayslips}>
                Payslips
              </button>

              <button
                className="add-btn reset-btn"
                onClick={handleResetPassword}
              >
                Reset Password
              </button>

              <button className="add-btn logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ================= PROFILE VIEW ================= */}
            <h3 className="section-title">My Profile</h3>

            <div className="profile-card">
              <ProfileRow label="Employee ID" value={employee.employeeId} />
              <ProfileRow label="Name" value={employee.name} />
              <ProfileRow label="Email" value={employee.email} />
              <ProfileRow label="Department" value={employee.department} />
              <ProfileRow label="Designation" value={employee.role} />
              <ProfileRow label="Bank Name" value={employee.bankName || "—"} />
              <ProfileRow
                label="Account Number"
                value={employee.accountNumber || "—"}
              />
              <ProfileRow
                label="PAN Number"
                value={employee.panNumber || "—"}
              />
            </div>

            <div className="dashboard-actions">
              <button className="add-btn" onClick={() => setShowProfile(false)}>
                ← Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DashBox = ({ title, value }) => (
  <div className="dash-box">
    <h4>{title}</h4>
    <p>{value}</p>
  </div>
);

const ProfileRow = ({ label, value }) => (
  <div className="profile-row">
    <span className="profile-label">{label}</span>
    <span className="profile-value">{value}</span>
  </div>
);

export default EmployeeDashboard;



