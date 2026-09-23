import React, { useEffect, useState } from "react";

const EmployeeDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Always get the latest token when making an API request
  const getToken = () => localStorage.getItem("token");

  /* =====================================================
     LOAD DOCUMENTS
     ===================================================== */

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);

        const currentToken = getToken();

        if (!currentToken) {
          throw new Error(
            "Authentication token not found. Please log in again."
          );
        }

        const response = await fetch("/api/documents", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          if (response.status === 403) {
            throw new Error(
              "You are not authorized to access company documents."
            );
          }

          throw new Error(
            data.message || "Failed to fetch documents"
          );
        }

        if (Array.isArray(data)) {
          setDocuments(data);
        } else if (Array.isArray(data?.documents)) {
          setDocuments(data.documents);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error("Documents error:", error);
        alert(error.message || "Unable to load company documents.");
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  /* =====================================================
     DOCUMENT URL
     ===================================================== */

  const getDocumentUrl = (documentId) => {
    if (!documentId) {
      return "#";
    }

    return `/api/documents/view/${encodeURIComponent(documentId)}`;
  };

  /* =====================================================
     VIEW DOCUMENT
     ===================================================== */

  const handleViewDocument = async (documentId) => {
    if (!documentId) {
      alert("Document ID is missing.");
      return;
    }

    const currentToken = getToken();

    if (!currentToken) {
      alert("Authentication token not found. Please log in again.");
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
        let message = "Unable to open document.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Response may not be JSON
        }

        if (response.status === 401) {
          message = "Your session has expired. Please log in again.";
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

      const blobUrl = window.URL.createObjectURL(blob);

      const newWindow = window.open(
        blobUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!newWindow) {
        alert(
          "Please allow pop-ups in your browser to view the document."
        );
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error) {
      console.error("Document view error:", error);

      alert(
        error.message ||
          "Unable to open document."
      );
    }
  };

  /* =====================================================
     DOWNLOAD DOCUMENT
     ===================================================== */

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
      alert("Authentication token not found. Please log in again.");
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
        let message = "Unable to download document.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Response may not be JSON
        }

        if (response.status === 401) {
          message = "Your session has expired. Please log in again.";
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

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = fileName || "document";

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

  /* =====================================================
     FILE EXTENSION
     ===================================================== */

  const getExtension = (fileName = "") => {
    return fileName
      .split(".")
      .pop()
      .toLowerCase();
  };

  /* =====================================================
     FILE ICON
     ===================================================== */

  const getFileIcon = (fileName = "") => {
    const extension = getExtension(fileName);

    switch (extension) {
      case "pdf":
        return "📕";

      case "xls":
      case "xlsx":
        return "📊";

      case "doc":
      case "docx":
        return "📘";

      case "jpg":
      case "jpeg":
      case "png":
        return "🖼️";

      default:
        return "📄";
    }
  };

  const canPreview = (fileName = "") => {
    const extension = getExtension(fileName);

    return [
      
      "pdf",
      "jpg",
      "jpeg",
      "png",
    ].includes(extension);
  };

  const getFileType = (fileName = "") => {
    const extension = getExtension(fileName);

    switch (extension) {
      case "pdf":
        return "PDF";

      case "xls":
      case "xlsx":
        return "Excel";

      case "doc":
      case "docx":
        return "Word";

      case "jpg":
      case "jpeg":
      case "png":
        return "Image";

      default:
        return "Document";
    }
  };

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="documents-page">
          <div className="documents-loading-card">
            <div className="documents-spinner"></div>

            <h3>Loading documents</h3>

            <p>
              Please wait while we fetch
              company documents.
            </p>
          </div>
        </div>
      </>
    );
  }

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <>
      <style>{styles}</style>

      <div className="documents-page">

        {/* HEADER */}

        <div className="documents-header">

          <div className="documents-title-section">

            <div className="documents-title-icon">
              📁
            </div>

            <div>
              <h2>
                Company Documents
              </h2>

              <p>
                Important documents and
                information shared by the
                company.
              </p>
            </div>

          </div>

          <div className="documents-count-box">
            <strong>
              {documents.length}
            </strong>

            <span>
              {documents.length === 1
                ? "Document"
                : "Documents"}
            </span>
          </div>

        </div>

        {/* EMPTY */}

        {documents.length === 0 ? (

          <div className="documents-empty-card">

            <div className="empty-document-icon">
              📂
            </div>

            <h3>
              No documents available
            </h3>

            <p>
              Company documents uploaded by
              the administrator will appear
              here.
            </p>

          </div>

        ) : (

          <div className="employee-documents-section">

            <div className="employee-documents-section-header">

              <div>

                <h3>
                  Available Documents
                </h3>

                <p>
                  Documents shared with all
                  employees
                </p>

              </div>

              <span className="documents-total">
                {documents.length}{" "}
                {documents.length === 1
                  ? "document"
                  : "documents"}
              </span>

            </div>

            {/* DOCUMENT LIST */}

            <div className="employee-documents-list">

              {documents.map((doc) => {

                const fileName =
                  doc.originalFileName ||
                  doc.original_file_name ||
                  "document";

                const previewAvailable =
                  canPreview(fileName);

                const fileType =
                  getFileType(fileName);

                return (

                  <div
                    className="employee-document-row"
                    key={doc.id}
                  >

                    {/* FILE ICON */}

                    <div className="document-file-icon">
                      {getFileIcon(fileName)}
                    </div>

                    {/* DOCUMENT INFO */}

                    <div className="employee-document-info">

                      <h3
                        title={
                          doc.documentName ||
                          doc.document_name ||
                          "Document"
                        }
                      >
                        {doc.documentName ||
                          doc.document_name ||
                          "Document"}
                      </h3>

                      <div className="document-file-name">

                        <span>
                          📎
                        </span>

                        <span title={fileName}>
                          {fileName}
                        </span>

                      </div>

                    </div>

                    {/* TYPE */}

                    <div className="document-row-type">

                      <span className="document-type-badge">
                        {doc.documentType ||
                          doc.document_type ||
                          fileType}
                      </span>

                    </div>

                    {/* DATE */}

                    <div className="document-row-date">

                      <span>
                        Uploaded
                      </span>

                      <strong>
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
                      </strong>

                    </div>

                    {/* ACTIONS */}

                    <div className="employee-document-actions">

                      {previewAvailable && (

                        <button
                          type="button"
                          className="document-view-btn"
                          onClick={() =>
                            handleViewDocument(
                              doc.id
                            )
                          }
                        >
                          <span>
                            👁
                          </span>

                          View
                        </button>

                      )}

                      <button
                        type="button"
                        className="document-download-btn"
                        onClick={() =>
                          handleDownloadDocument(
                            doc.id,
                            fileName
                          )
                        }
                      >
                        <span>
                          ⬇
                        </span>

                        Download
                      </button>

                    </div>

                  </div>

                );
              })}

            </div>

          </div>

        )}

      </div>
    </>
  );
};

/* =====================================================
   CSS
===================================================== */

const styles = `

.documents-page {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
  background: #f8fafc;
  min-height: 100%;
}

.documents-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.documents-title-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.documents-title-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
}

.documents-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #172033;
}

.documents-header p {
  margin: 5px 0 0;
  color: #697386;
  font-size: 14px;
}

.documents-count-box {
  min-width: 90px;
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.documents-count-box strong {
  font-size: 20px;
  color: #172033;
}

.documents-count-box span {
  font-size: 12px;
  color: #737b8c;
}

.employee-documents-section {
  background: #ffffff;
  border: 1px solid #e6e9ef;
  border-radius: 14px;
  overflow: hidden;
}

.employee-documents-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #edf0f4;
}

.employee-documents-section-header h3 {
  margin: 0;
  font-size: 17px;
  color: #172033;
}

.employee-documents-section-header p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #7a8291;
}

.documents-total {
  font-size: 13px;
  font-weight: 600;
  color: #5b6474;
}

.employee-documents-list {
  width: 100%;
}

.employee-document-row {
  display: grid;
  grid-template-columns:
    52px
    minmax(250px, 1fr)
    130px
    140px
    190px;
  align-items: center;
  gap: 18px;
  padding: 15px 20px;
  border-bottom: 1px solid #edf0f4;
  transition: background 0.2s ease;
}

.employee-document-row:last-child {
  border-bottom: none;
}

.employee-document-row:hover {
  background: #fafbff;
}

.document-file-icon {
  width: 48px;
  height: 48px;
  border-radius: 11px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.employee-document-info {
  min-width: 0;
}

.employee-document-info h3 {
  margin: 0 0 7px;
  font-size: 15px;
  font-weight: 650;
  color: #202938;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-file-name {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #788293;
  font-size: 12px;
  min-width: 0;
}

.document-file-name span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-row-type {
  display: flex;
  justify-content: center;
}

.document-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #596273;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.document-row-date {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.document-row-date span {
  font-size: 11px;
  color: #9299a6;
}

.document-row-date strong {
  font-size: 12px;
  color: #4b5565;
  font-weight: 600;
}

.employee-document-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.document-view-btn,
.document-download-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
  border: none;
}

.document-view-btn {
  background: #eef2ff;
  color: #4f46e5;
}

.document-view-btn:hover {
  background: #e0e7ff;
}

.document-download-btn {
  background: #4f46e5;
  color: #ffffff;
}

.document-download-btn:hover {
  background: #293449;
}

.documents-empty-card {
  background: #ffffff;
  border: 1px solid #e6e9ef;
  border-radius: 14px;
  padding: 55px 20px;
  text-align: center;
}

.empty-document-icon {
  font-size: 42px;
  margin-bottom: 12px;
}

.documents-empty-card h3 {
  margin: 0 0 7px;
  color: #202938;
  font-size: 17px;
}

.documents-empty-card p {
  margin: 0 auto;
  max-width: 430px;
  color: #7a8291;
  font-size: 13px;
  line-height: 1.6;
}

.documents-loading-card {
  background: #ffffff;
  border: 1px solid #e6e9ef;
  border-radius: 14px;
  padding: 60px 20px;
  text-align: center;
}

.documents-loading-card h3 {
  margin: 14px 0 5px;
  color: #202938;
}

.documents-loading-card p {
  margin: 0;
  color: #7a8291;
  font-size: 13px;
}

.documents-spinner {
  width: 32px;
  height: 32px;
  margin: auto;
  border: 3px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: documentSpin 0.8s linear infinite;
}

@keyframes documentSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1000px) {
  .employee-document-row {
    grid-template-columns:
      48px
      minmax(200px, 1fr)
      110px
      170px;
    gap: 12px;
  }

  .document-row-date {
    display: none;
  }
}

@media (max-width: 700px) {
  .documents-page {
    padding: 14px;
  }

  .documents-header {
    align-items: flex-start;
  }

  .documents-header h2 {
    font-size: 20px;
  }

  .documents-count-box {
    min-width: 65px;
  }

  .employee-documents-section-header {
    padding: 15px;
  }

  .employee-document-row {
    grid-template-columns:
      44px
      minmax(0, 1fr);
    gap: 12px;
    padding: 13px 15px;
  }

  .employee-document-row .document-file-icon {
    width: 44px;
    height: 44px;
    font-size: 20px;
  }

  .document-row-type {
    display: none;
  }

  .employee-document-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
    padding-left: 56px;
  }
}

@media (max-width: 450px) {
  .documents-title-icon {
    width: 40px;
    height: 40px;
  }

  .documents-header p {
    display: none;
  }

  .documents-total {
    display: none;
  }

  .employee-document-actions {
    padding-left: 0;
  }
}

`;

export default EmployeeDocuments;