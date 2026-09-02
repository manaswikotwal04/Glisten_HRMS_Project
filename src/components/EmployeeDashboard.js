import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    workedDays: 0,
    leaveDays: 0,
    totalWorkingDays: 0,
    attendancePercentage: 0,
  });

  const token = localStorage.getItem("token");

  /* =====================================================
     LOGOUT
     ===================================================== */

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* =====================================================
     CHANGE PASSWORD
     ===================================================== */

  const handleResetPassword = () => {
    navigate("/app/change-password");
  };

  /* =====================================================
     PAYSLIPS
     ===================================================== */

  const openPayslips = () => {
    if (employee?.employeeId) {
      navigate(`/app/employee-payslips/${employee.employeeId}`);
    }
  };
  const openDocuments = () => {
    navigate("/app/documents");
  };
  /* =====================================================
     FILE HELPERS
     ===================================================== */

  const getExtension = (fileName = "") => {
    return fileName.split(".").pop().toLowerCase();
  };

  const getFileIcon = (fileName = "") => {
    const extension = getExtension(fileName);

    if (extension === "pdf") return "📕";

    if (["xls", "xlsx"].includes(extension)) {
      return "📊";
    }

    if (["doc", "docx"].includes(extension)) {
      return "📘";
    }

    if (["jpg", "jpeg", "png"].includes(extension)) {
      return "🖼️";
    }

    return "📄";
  };

  const canPreview = (fileName = "") => {
    const extension = getExtension(fileName);

    return ["pdf", "jpg", "jpeg", "png"].includes(extension);
  };

  /* =====================================================
     LOAD EMPLOYEE
     ===================================================== */

  useEffect(() => {
    const loadEmployee = async () => {
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

      try {
        const response = await fetch(`/api/employee/id/${user.employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch employee");
        }

        const data = await response.json();

        setEmployee(data);
      } catch (error) {
        console.error("Employee fetch error:", error);

        alert("Session expired. Please login again.");

        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, []);

  /* =====================================================
     LOAD LATEST DOCUMENTS
     ===================================================== */

  useEffect(() => {
    const loadDocuments = async () => {
      if (!token) return;

      try {
        const response = await fetch("/api/documents", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to load documents");
          return;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setDocuments(data.slice(0, 2));
        }
      } catch (error) {
        console.error("Documents error:", error);
      }
    };

    loadDocuments();
  }, [token]);

  /* =====================================================
     LOAD ATTENDANCE / LEAVE ANALYSIS
     
     IMPORTANT:
     This section expects your attendance API to return
     actual attendance information.
     
     If your existing endpoint/response fields are different,
     only this block needs to be adjusted.
     ===================================================== */

  useEffect(() => {
    const loadAttendance = async () => {
      if (!token) return;

      try {
        /*
          Existing attendance endpoint.
          
          If your backend endpoint is different,
          change only this URL.
        */

        const response = await fetch("/api/attendance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log("Attendance data unavailable");
          return;
        }

        const data = await response.json();

        /*
          Try to handle common response formats.
        */

        const attendanceArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.attendance)
            ? data.attendance
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (!attendanceArray.length) {
          return;
        }

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const currentMonthAttendance = attendanceArray.filter((item) => {
          const dateValue = item.date || item.attendanceDate || item.createdAt;

          if (!dateValue) return false;

          const date = new Date(dateValue);

          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        });

        const workedDays = currentMonthAttendance.filter((item) => {
          const status = String(
            item.status || item.attendanceStatus || "",
          ).toLowerCase();

          return status === "present" || status === "worked" || status === "p";
        }).length;

        const leaveDays = currentMonthAttendance.filter((item) => {
          const status = String(
            item.status || item.attendanceStatus || "",
          ).toLowerCase();

          return status === "leave" || status === "absent" || status === "l";
        }).length;

        const totalWorkingDays = workedDays + leaveDays;

        const attendancePercentage =
          totalWorkingDays > 0
            ? Math.round((workedDays / totalWorkingDays) * 100)
            : 0;

        setAttendanceData({
          workedDays,
          leaveDays,
          totalWorkingDays,
          attendancePercentage,
        });
      } catch (error) {
        console.error("Attendance analysis error:", error);
      }
    };

    loadAttendance();
  }, [token]);

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div className="employee-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!employee) return null;

  /* =====================================================
     CALCULATIONS
     ===================================================== */

  const workedPercentage =
    attendanceData.totalWorkingDays > 0
      ? Math.round(
          (attendanceData.workedDays / attendanceData.totalWorkingDays) * 100,
        )
      : 0;

  const leavePercentage =
    attendanceData.totalWorkingDays > 0
      ? Math.round(
          (attendanceData.leaveDays / attendanceData.totalWorkingDays) * 100,
        )
      : 0;

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="employee-dashboard">
      {/* =================================================
          HEADER
          ================================================= */}

      <div className="dashboard-header">
        <div>
          <p className="welcome-small">Welcome back 👋</p>

          <h2>{employee.name || "Employee"}</h2>

          <p className="header-subtitle">
            Here's a quick overview of your HRMS account.
          </p>
        </div>

        <div className="header-profile">
          <div className="profile-avatar">
            {(employee.name || "E").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{employee.name || "Employee"}</strong>

            <span>{employee.role || "Employee"}</span>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <div className="dashboard-content">
        {/* EMPLOYEE INFORMATION */}

        <div className="dashboard-panel employee-info-panel">
          <div className="panel-header">
            <div>
              <h3>My Information</h3>

              <p>Quick employee details</p>
            </div>

            <button className="text-btn" onClick={() => setShowProfile(true)}>
              View Profile →
            </button>
          </div>

          <div className="info-grid">
            <InfoItem label="Employee ID" value={employee.employeeId} />

            <InfoItem label="Department" value={employee.department || "—"} />

            <InfoItem label="Designation" value={employee.role || "—"} />

            <InfoItem label="Email" value={employee.email || "—"} />
          </div>
        </div>

        {/* QUICK ACTIONS */}

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>Quick Actions</h3>

              <p>Frequently used options</p>
            </div>
          </div>

          <div className="quick-actions">
            <ActionButton
              icon="🌴"
              title="Apply Leave"
              onClick={() => navigate("/app/apply-leave")}
            />

            <ActionButton
              icon="📋"
              title="My Leaves"
              onClick={() => navigate("/app/my-leaves")}
            />

            <ActionButton icon="💰" title="Payslips" onClick={openPayslips} />

            <ActionButton
              icon="🔐"
              title="Change Password"
              onClick={handleResetPassword}
            />
          </div>
        </div>
      </div>

      {/* =================================================
          LATEST DOCUMENTS
          ================================================= */}

      <div className="dashboard-panel latest-documents-panel">
        <div className="panel-header">
          <div>
            <h3>Latest Documents</h3>

            <p>Recently shared company documents</p>
          </div>

          <div className="document-menu-wrapper">
            <button
              className="three-dot-btn"
              onClick={() => setShowDocumentMenu(!showDocumentMenu)}
              title="More options"
            >
              ⋮
            </button>

            {showDocumentMenu && (
              <div className="document-dropdown">
                <button
                  onClick={() => {
                    setShowDocumentMenu(false);
                    openDocuments();
                  }}
                >
                  View All Documents
                </button>
              </div>
            )}
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="latest-documents-empty">
            <span>📂</span>

            <p>No company documents available.</p>
          </div>
        ) : (
          <div className="latest-documents-list">
            {documents.map((doc) => {
              const fileUrl = doc.filePath;

              const preview = canPreview(doc.originalFileName);

              return (
                <div className="latest-document-item" key={doc.id}>
                  <div className="latest-document-icon">
                    {getFileIcon(doc.originalFileName)}
                  </div>

                  <div className="latest-document-info">
                    <strong title={doc.documentName}>{doc.documentName}</strong>

                    <span>{doc.originalFileName}</span>

                    <small>
                      {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </small>
                  </div>

                  <div className="latest-document-actions">
                    {preview && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="latest-view-btn"
                      >
                        View
                      </a>
                    )}

                    <a
                      href={fileUrl}
                      download={doc.originalFileName}
                      className="latest-download-btn"
                    >
                      Download
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================
          LEAVE & ATTENDANCE ANALYSIS
          ================================================= */}

      <div className="dashboard-panel attendance-analysis-panel">
        <div className="panel-header">
          <div>
            <h3>Leave & Attendance Analysis</h3>

            <p>Current month overview</p>
          </div>

          <span className="analysis-month">
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="analysis-summary">
          <AnalysisCard
            icon="💼"
            title="Worked Days"
            value={
              attendanceData.totalWorkingDays > 0
                ? attendanceData.workedDays
                : "—"
            }
            subtitle="Days worked"
          />

          <AnalysisCard
            icon="🌴"
            title="Leave Days"
            value={
              attendanceData.totalWorkingDays > 0
                ? attendanceData.leaveDays
                : "—"
            }
            subtitle="Leave / absent"
          />

          <AnalysisCard
            icon="📊"
            title="Attendance"
            value={
              attendanceData.totalWorkingDays > 0
                ? `${attendanceData.attendancePercentage}%`
                : "—"
            }
            subtitle="Attendance rate"
          />
        </div>

        {/* PROGRESS */}

        <div className="attendance-progress-section">
          <div className="progress-heading">
            <span>Worked Days</span>

            <strong>
              {attendanceData.totalWorkingDays > 0
                ? `${workedPercentage}%`
                : "—"}
            </strong>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill worked-progress"
              style={{
                width: `${workedPercentage}%`,
              }}
            ></div>
          </div>

          <div className="progress-heading leave-progress-heading">
            <span>Leave / Absent</span>

            <strong>
              {attendanceData.totalWorkingDays > 0
                ? `${leavePercentage}%`
                : "—"}
            </strong>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill leave-progress"
              style={{
                width: `${leavePercentage}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* =================================================
          PROFILE MODAL
          ================================================= */}

      {showProfile && (
        <div className="profile-overlay">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <div>
                <h3>My Profile</h3>

                <p>Employee information</p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowProfile(false)}
              >
                ×
              </button>
            </div>

            <div className="profile-details">
              <ProfileRow label="Employee ID" value={employee.employeeId} />

              <ProfileRow label="Name" value={employee.name} />

              <ProfileRow label="Email" value={employee.email} />

              <ProfileRow label="Department" value={employee.department} />

              <ProfileRow label="Designation" value={employee.role} />

              <ProfileRow label="Bank Name" value={employee.bankName} />

              <ProfileRow
                label="Account Number"
                value={employee.accountNumber}
              />

              <ProfileRow label="PAN Number" value={employee.panNumber} />
            </div>

            <button
              className="profile-back-btn"
              onClick={() => setShowProfile(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          LOGOUT
          ================================================= */}

      <div className="dashboard-footer">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="info-item">
    <span>{label}</span>

    <strong>{value}</strong>
  </div>
);

/* =====================================================
   ACTION BUTTON
   ===================================================== */

const ActionButton = ({ icon, title, onClick }) => (
  <button className="action-button" onClick={onClick}>
    <span className="action-icon">{icon}</span>

    <span className="action-title">{title}</span>

    <span className="action-arrow">→</span>
  </button>
);

/* =====================================================
   ANALYSIS CARD
   ===================================================== */

const AnalysisCard = ({ icon, title, value, subtitle }) => (
  <div className="analysis-card">
    <div className="analysis-icon">{icon}</div>

    <div>
      <span>{title}</span>

      <strong>{value}</strong>

      <small>{subtitle}</small>
    </div>
  </div>
);

/* =====================================================
   PROFILE ROW
   ===================================================== */

const ProfileRow = ({ label, value }) => (
  <div className="profile-row">
    <span className="profile-label">{label}</span>

    <span className="profile-value">{value || "—"}</span>
  </div>
);

export default EmployeeDashboard;
