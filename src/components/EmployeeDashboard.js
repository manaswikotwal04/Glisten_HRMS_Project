import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);
  const [documents, setDocuments] = useState([]);

  /*
  ====================================================
  AUTH TOKEN
  ====================================================
  Always get the latest token from localStorage.
  This avoids using an old token after navigation.
  */
  const getToken = () => localStorage.getItem("token");

  /*
  ====================================================
  LOGOUT
  ====================================================
  Only this function removes authentication data.
  Clicking Documents will NEVER call this function.
  */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  /*
  ====================================================
  CHANGE PASSWORD
  ====================================================
  */
  const handleResetPassword = () => {
    navigate("/app/change-password");
  };

  /*
  ====================================================
  PAYSLIPS
  ====================================================
  */
  const openPayslips = () => {
    if (employee?.employeeId) {
      navigate(
        `/app/employee-payslips/${employee.employeeId}`
      );
    }
  };

  /*
  ====================================================
  EMPLOYEE DOCUMENTS
  ====================================================

  IMPORTANT:
  This function ONLY navigates.

  It does NOT:
  - remove token
  - remove role
  - remove user
  - call logout
  */
  const openDocuments = () => {
    setShowDocumentMenu(false);

    navigate("/app/employee-documents");
  };

  /*
  ====================================================
  FILE EXTENSION
  ====================================================
  */
  const getExtension = (fileName = "") => {
    return fileName
      .split(".")
      .pop()
      .toLowerCase();
  };

  /*
  ====================================================
  FILE ICON
  ====================================================
  */
  const getFileIcon = (fileName = "") => {
    const extension = getExtension(fileName);

    if (extension === "pdf") {
      return "📕";
    }

    if (
      ["xls", "xlsx"].includes(extension)
    ) {
      return "📊";
    }

    if (
      ["doc", "docx"].includes(extension)
    ) {
      return "📘";
    }

    if (
      ["jpg", "jpeg", "png"].includes(extension)
    ) {
      return "🖼️";
    }

    return "📄";
  };

  /*
  ====================================================
  CAN PREVIEW
  ====================================================
  */
  const canPreview = (fileName = "") => {
    const extension = getExtension(fileName);

    return [
      "pdf",
      "jpg",
      "jpeg",
      "png",
    ].includes(extension);
  };

  /*
  ====================================================
  DOCUMENT URL
  ====================================================
  */
  const getDocumentUrl = (documentId) => {
    if (!documentId) {
      return "#";
    }

    return `/api/documents/view/${encodeURIComponent(
      documentId
    )}`;
  };

  /*
  ====================================================
  VIEW DOCUMENT
  ====================================================
  */
  const handleViewDocument = async (documentId) => {
    if (!documentId) {
      alert("Document ID is missing.");
      return;
    }

    const currentToken = getToken();

    if (!currentToken) {
      alert(
        "Authentication token not found. Please log in again."
      );
      return;
    }

    try {
      const response = await fetch(
        getDocumentUrl(documentId),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        let message =
          "Unable to open document.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Response may not be JSON.
        }

        if (response.status === 401) {
          message =
            "Your session has expired. Please log in again.";
        }

        if (response.status === 403) {
          message =
            "You are not authorized to view this document.";
        }

        if (response.status === 404) {
          message =
            "Document was not found on the server.";
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const blobUrl =
        window.URL.createObjectURL(blob);

      const newWindow = window.open(
        blobUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!newWindow) {
        alert(
          "Please allow pop-ups to view the document."
        );
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error) {
      console.error(
        "Document view error:",
        error
      );

      alert(
        error.message ||
          "Unable to open document."
      );
    }
  };

  /*
  ====================================================
  DOWNLOAD DOCUMENT
  ====================================================
  */
  const handleDownloadDocument = async (
    documentId,
    fileName
  ) => {
    if (!documentId) {
      alert("Document ID is missing.");
      return;
    }

    const currentToken = getToken();

    if (!currentToken) {
      alert(
        "Authentication token not found. Please log in again."
      );
      return;
    }

    try {
      const response = await fetch(
        getDocumentUrl(documentId),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        let message =
          "Unable to download document.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Response may not be JSON.
        }

        if (response.status === 401) {
          message =
            "Your session has expired. Please log in again.";
        }

        if (response.status === 403) {
          message =
            "You are not authorized to download this document.";
        }

        if (response.status === 404) {
          message =
            "Document was not found on the server.";
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const blobUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = blobUrl;

      link.download =
        fileName || "document";

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error(
        "Document download error:",
        error
      );

      alert(
        error.message ||
          "Unable to download document."
      );
    }
  };

  /*
  ====================================================
  LOAD EMPLOYEE
  ====================================================
  */
  useEffect(() => {
    let cancelled = false;

    const loadEmployee = async () => {
      const role =
        localStorage.getItem("role");

      const currentToken = getToken();

      let user = null;

      try {
        const storedUser =
          localStorage.getItem("user");

        if (storedUser) {
          user = JSON.parse(storedUser);
        }
      } catch {
        user = null;
      }

      /*
      Only redirect if authentication data
      is genuinely missing.
      */
      if (
        !user ||
        !currentToken ||
        role?.toLowerCase() !== "employee"
      ) {
        if (!cancelled) {
          navigate("/login", {
            replace: true,
          });
        }

        return;
      }

      /*
      Employee ID is required.
      */
      if (!user.employeeId) {
        if (!cancelled) {
          alert(
            "Employee ID missing. Please login again."
          );

          navigate("/login", {
            replace: true,
          });
        }

        return;
      }

      try {
        const response = await fetch(
          `/api/employee/id/${encodeURIComponent(
            user.employeeId
          )}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${currentToken}`,
            },
          }
        );

        /*
        =================================================
        IMPORTANT AUTHENTICATION LOGIC
        =================================================

        Only 401 / 403 should cause logout.

        Do NOT logout for:
        - 404
        - 500
        - server temporarily unavailable
        - network error
        */
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          if (!cancelled) {
            alert(
              "Your session has expired. Please login again."
            );

            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user");

            navigate("/login", {
              replace: true,
            });
          }

          return;
        }

        if (!response.ok) {
          throw new Error(
            `Failed to fetch employee (${response.status})`
          );
        }

        const data =
          await response.json();

        if (!cancelled) {
          setEmployee(data);
        }
      } catch (error) {
        console.error(
          "Employee fetch error:",
          error
        );

        /*
        IMPORTANT:
        Do NOT call handleLogout() here.

        If the API temporarily fails, keep the
        employee logged in and use the stored user.
        */
        if (!cancelled) {
          setEmployee(user);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEmployee();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
  ====================================================
  LOAD LATEST DOCUMENTS
  ====================================================
  */
  useEffect(() => {
    let cancelled = false;

    const loadDocuments = async () => {
      const currentToken = getToken();

      if (!currentToken) {
        return;
      }

      try {
        const response = await fetch(
          "/api/documents",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${currentToken}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            "Failed to load documents:",
            data
          );

          return;
        }

        if (cancelled) {
          return;
        }

        if (Array.isArray(data)) {
          setDocuments(
            data.slice(0, 2)
          );
        } else if (
          Array.isArray(data?.documents)
        ) {
          setDocuments(
            data.documents.slice(0, 2)
          );
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error(
          "Documents error:",
          error
        );
      }
    };

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  ====================================================
  LOADING SCREEN
  ====================================================
  */
  if (loading) {
    return (
      <div className="employee-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading your dashboard...
        </p>

      </div>
    );
  }

  if (!employee) {
    return null;
  }

  /*
  ====================================================
  RENDER
  ====================================================
  */
  return (
    <div className="employee-dashboard">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="dashboard-header">

        <div>

          <p className="welcome-small">
            Welcome back 👋
          </p>

          <h2>
            {employee.name ||
              "Employee"}
          </h2>

          <p className="header-subtitle">
            Here's a quick overview of
            your HRMS account.
          </p>

        </div>

        <div className="header-profile">

          <div className="profile-avatar">
            {(employee.name ||
              "E")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>

            <strong>
              {employee.name ||
                "Employee"}
            </strong>

            <span>
              {employee.role ||
                "Employee"}
            </span>

          </div>

        </div>

      </div>

      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <div className="dashboard-content">

        {/* =================================================
            EMPLOYEE INFORMATION
            ================================================= */}

        <div className="dashboard-panel employee-info-panel">

          <div className="panel-header">

            <div>

              <h3>
                My Information
              </h3>

              <p>
                Quick employee details
              </p>

            </div>

            <button
              type="button"
              className="text-btn"
              onClick={() =>
                setShowProfile(true)
              }
            >
              View Profile →
            </button>

          </div>

          <div className="info-grid">

            <InfoItem
              label="Employee ID"
              value={
                employee.employeeId
              }
            />

            <InfoItem
              label="Department"
              value={
                employee.department ||
                "—"
              }
            />

            <InfoItem
              label="Designation"
              value={
                employee.role ||
                "—"
              }
            />

            <InfoItem
              label="Email"
              value={
                employee.email ||
                "—"
              }
            />

          </div>

        </div>

        {/* =================================================
            QUICK ACTIONS
            ================================================= */}

        <div className="dashboard-panel">

          <div className="panel-header">

            <div>

              <h3>
                Quick Actions
              </h3>

              <p>
                Frequently used options
              </p>

            </div>

          </div>

          <div className="quick-actions">

            <ActionButton
              icon="🌴"
              title="Apply Leave"
              onClick={() =>
                navigate(
                  "/app/apply-leave"
                )
              }
            />

            <ActionButton
              icon="📋"
              title="My Leaves"
              onClick={() =>
                navigate(
                  "/app/my-leaves"
                )
              }
            />

            <ActionButton
              icon="💰"
              title="Payslips"
              onClick={
                openPayslips
              }
            />

            <ActionButton
              icon="🔐"
              title="Change Password"
              onClick={
                handleResetPassword
              }
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

            <h3>
              Latest Documents
            </h3>

            <p>
              Recently shared company
              documents
            </p>

          </div>

          <div className="document-menu-wrapper">

            <button
              type="button"
              className="three-dot-btn"
              onClick={() =>
                setShowDocumentMenu(
                  (current) => !current
                )
              }
              title="More options"
            >
              ⋮
            </button>

            {showDocumentMenu && (

              <div className="document-dropdown">

                <button
                  type="button"
                  onClick={openDocuments}
                >
                  View All Documents
                </button>

              </div>

            )}

          </div>

        </div>

        {/* =================================================
            NO DOCUMENTS
            ================================================= */}

        {documents.length === 0 ? (

          <div className="latest-documents-empty">

            <span>
              📂
            </span>

            <p>
              No company documents
              available.
            </p>

          </div>

        ) : (

          <div className="latest-documents-list">

            {documents.map((doc) => {

              const fileName =
                doc.originalFileName ||
                doc.original_file_name ||
                "document";

              const preview =
                canPreview(fileName);

              return (

                <div
                  className="latest-document-item"
                  key={doc.id}
                >

                  {/* DOCUMENT ICON */}

                  <div className="latest-document-icon">

                    {getFileIcon(
                      fileName
                    )}

                  </div>

                  {/* DOCUMENT INFORMATION */}

                  <div className="latest-document-info">

                    <strong
                      title={
                        doc.documentName ||
                        doc.document_name
                      }
                    >
                      {doc.documentName ||
                        doc.document_name ||
                        "Document"}
                    </strong>

                    <span>
                      {fileName}
                    </span>

                    <small>

                      {doc.createdAt ||
                      doc.created_at
                        ? new Date(
                            doc.createdAt ||
                              doc.created_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "—"}

                    </small>

                  </div>

                  {/* DOCUMENT ACTIONS */}

                  <div className="latest-document-actions">

                    {preview && (

                      <button
                        type="button"
                        className="latest-view-btn"
                        onClick={() =>
                          handleViewDocument(
                            doc.id
                          )
                        }
                      >
                        View
                      </button>

                    )}

                    <button
                      type="button"
                      className="latest-download-btn"
                      onClick={() =>
                        handleDownloadDocument(
                          doc.id,
                          fileName
                        )
                      }
                    >
                      Download
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </div>

      {/* =================================================
          PROFILE MODAL
          ================================================= */}

      {showProfile && (

        <div className="profile-overlay">

          <div className="profile-modal">

            <div className="profile-modal-header">

              <div>

                <h3>
                  My Profile
                </h3>

                <p>
                  Employee information
                </p>

              </div>

              <button
                type="button"
                className="close-btn"
                onClick={() =>
                  setShowProfile(false)
                }
              >
                ×
              </button>

            </div>

            <div className="profile-details">

              <ProfileRow
                label="Employee ID"
                value={
                  employee.employeeId
                }
              />

              <ProfileRow
                label="Name"
                value={
                  employee.name
                }
              />

              <ProfileRow
                label="Email"
                value={
                  employee.email
                }
              />

              <ProfileRow
                label="Department"
                value={
                  employee.department
                }
              />

              <ProfileRow
                label="Designation"
                value={
                  employee.role
                }
              />

              <ProfileRow
                label="Bank Name"
                value={
                  employee.bankName
                }
              />

              <ProfileRow
                label="Account Number"
                value={
                  employee.accountNumber
                }
              />

              <ProfileRow
                label="PAN Number"
                value={
                  employee.panNumber
                }
              />

            </div>

            <button
              type="button"
              className="profile-back-btn"
              onClick={() =>
                setShowProfile(false)
              }
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

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </div>
  );
};

/* =====================================================
   INFO ITEM
===================================================== */

const InfoItem = ({
  label,
  value,
}) => (
  <div className="info-item">

    <span>
      {label}
    </span>

    <strong>
      {value}
    </strong>

  </div>
);

/* =====================================================
   ACTION BUTTON
===================================================== */

const ActionButton = ({
  icon,
  title,
  onClick,
}) => (
  <button
    type="button"
    className="action-button"
    onClick={onClick}
  >

    <span className="action-icon">
      {icon}
    </span>

    <span className="action-title">
      {title}
    </span>

    <span className="action-arrow">
      →
    </span>

  </button>
);

/* =====================================================
   PROFILE ROW
===================================================== */

const ProfileRow = ({
  label,
  value,
}) => (
  <div className="profile-row">

    <span className="profile-label">
      {label}
    </span>

    <span className="profile-value">
      {value || "—"}
    </span>

  </div>
);

export default EmployeeDashboard;