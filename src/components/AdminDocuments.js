import React, { useEffect, useState } from "react";

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const token = localStorage.getItem("token");

  /*
  ====================================================
  LOAD DOCUMENTS
  ====================================================
  */

  const loadDocuments = async () => {
    try {
      setFetching(true);

      const response = await fetch("/api/documents/admin", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load documents");
      }

      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load documents error:", error);

      alert(error.message || "Failed to load documents");
    } finally {
      setFetching(false);
    }
  };

  /*
  ====================================================
  INITIAL LOAD
  ====================================================
  */

  useEffect(() => {
    if (!token) {
      alert("Please login again.");
      return;
    }

    loadDocuments();
  }, []);

  /*
  ====================================================
  FILE CHANGE
  ====================================================
  */

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".jpg",
      ".jpeg",
      ".png",
    ];

    const fileName = selectedFile.name.toLowerCase();

    const extension = fileName.substring(fileName.lastIndexOf("."));

    if (!allowedExtensions.includes(extension)) {
      alert(
        "Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG and PNG files are allowed."
      );

      e.target.value = "";
      setFile(null);

      return;
    }

    /*
    10 MB limit
    */

    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      alert("File size must be less than 10 MB.");

      e.target.value = "";
      setFile(null);

      return;
    }

    setFile(selectedFile);
  };

  /*
  ====================================================
  UPLOAD DOCUMENT
  ====================================================
  */

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!documentName.trim()) {
      alert("Please enter document name");
      return;
    }

    if (!file) {
      alert("Please select a document");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("documentName", documentName.trim());

      formData.append("documentType", documentType);

      formData.append("document", file);

      const response = await fetch("/api/documents/upload", {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      alert("Document uploaded successfully");

      setDocumentName("");
      setDocumentType("");
      setFile(null);

      const fileInput = document.getElementById("document-file");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();
    } catch (error) {
      console.error("Upload error:", error);

      alert(error.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /*
  ====================================================
  DELETE
  ====================================================
  */

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      alert("Document deleted successfully");

      await loadDocuments();
    } catch (error) {
      console.error("Delete error:", error);

      alert(error.message || "Delete failed");
    }
  };

  /*
  ====================================================
  FILE TYPE
  ====================================================
  */

  const getFileExtension = (fileName) => {
    if (!fileName) return "";

    return fileName
      .substring(fileName.lastIndexOf(".") + 1)
      .toLowerCase();
  };

  /*
  ====================================================
  FILE URL
  ====================================================
  */

  const getFileUrl = (filePath) => {
    if (!filePath) {
      return "#";
    }

    return filePath;
  };

  /*
  ====================================================
  CHECK EXCEL
  ====================================================
  */

  const isExcelFile = (fileName) => {
    const extension = getFileExtension(fileName);

    return extension === "xls" || extension === "xlsx";
  };

  /*
  ====================================================
  RENDER
  ====================================================
  */

  return (
    <>
      <style>{`
        .documents-page {
          min-height: 100%;
          padding: 28px;
          background: #f6f8fb;
          color: #172033;
          font-family: Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          box-sizing: border-box;
        }

        .documents-shell {
          max-width: 1180px;
          margin: 0 auto;
        }

        /* HEADER */

        .documents-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .documents-title-wrap {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .documents-title-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #e9efff;
          color: #3157d5;
          font-size: 24px;
          box-shadow: 0 6px 18px rgba(49, 87, 213, 0.08);
        }

        .documents-header h2 {
          margin: 0 0 5px;
          font-size: 26px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.4px;
        }

        .documents-header p {
          margin: 0;
          color: #718096;
          font-size: 14px;
        }

        /* CARDS */

        .document-upload-card,
        .document-list-card {
          background: #ffffff;
          border: 1px solid #e7ebf2;
          border-radius: 18px;
          box-shadow: 0 8px 30px rgba(31, 41, 55, 0.06);
        }

        .document-upload-card {
          padding: 24px;
          margin-bottom: 22px;
        }

        /* CARD HEADING */

        .card-heading {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 20px;
        }

        .card-heading-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #f0f4ff;
          color: #3157d5;
          font-size: 18px;
        }

        .card-heading h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
        }

        .card-heading p {
          margin: 3px 0 0;
          font-size: 12px;
          color: #8993a4;
        }

        /* FORM */

        .document-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1.2fr;
          gap: 18px;
        }

        .form-group {
          min-width: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #3c4658;
        }

        .form-group input[type="text"],
        .form-group select {
          width: 100%;
          height: 46px;
          box-sizing: border-box;
          padding: 0 13px;
          border: 1px solid #dfe4ec;
          border-radius: 10px;
          background: #fbfcfe;
          color: #202939;
          font-size: 14px;
          outline: none;
          transition:
            border-color 0.2s,
            box-shadow 0.2s,
            background 0.2s;
        }

        .form-group input[type="text"]::placeholder {
          color: #a2aab8;
        }

        .form-group input[type="text"]:focus,
        .form-group select:focus {
          border-color: #6d87df;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(49, 87, 213, 0.1);
        }

        /* FILE INPUT */

        .file-picker {
          height: 46px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border: 1px dashed #bdc7d8;
          border-radius: 10px;
          background: #fbfcfe;
          overflow: hidden;
        }

        .file-picker input[type="file"] {
          width: 100%;
          font-size: 13px;
          color: #657085;
        }

        .file-picker input[type="file"]::file-selector-button {
          margin-right: 10px;
          border: 0;
          border-radius: 7px;
          padding: 7px 11px;
          background: #eef2ff;
          color: #3157d5;
          font-weight: 600;
          cursor: pointer;
        }

        .form-group small {
          display: block;
          margin-top: 7px;
          color: #8993a4;
          font-size: 11px;
        }

        .selected-file {
          margin-top: 9px;
          padding: 8px 10px;
          border-radius: 8px;
          background: #f1faf5;
          color: #327451;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* UPLOAD BUTTON */

        .document-upload-btn {
          margin-top: 20px;
          min-width: 155px;
          height: 44px;
          padding: 0 18px;
          border: 0;
          border-radius: 10px;
          background: #3157d5;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 7px 16px rgba(49, 87, 213, 0.2);
          transition:
            transform 0.15s,
            box-shadow 0.15s,
            opacity 0.15s;
        }

        .document-upload-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 9px 20px rgba(49, 87, 213, 0.25);
        }

        .document-upload-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .document-upload-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* DOCUMENT LIST */

        .document-list-card {
          overflow: hidden;
        }

        .document-list-header {
          padding: 21px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #edf0f5;
        }

        .list-title {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .list-title-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #f5f7fa;
          color: #596579;
          font-size: 18px;
        }

        .document-list-header h3 {
          margin: 0 0 3px;
          font-size: 17px;
        }

        .document-list-header p {
          margin: 0;
          color: #8993a4;
          font-size: 12px;
        }

        .document-count {
          min-width: 30px;
          height: 30px;
          padding: 0 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #eef2ff;
          color: #3157d5;
          font-size: 12px;
          font-weight: 700;
        }

        .documents-list {
          padding: 8px 24px 16px;
        }

        .document-item {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) auto;
          align-items: center;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #eef1f5;
        }

        .document-item:last-child {
          border-bottom: 0;
        }

        /* DOCUMENT ICON */

        .document-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #f3f6fb;
          font-size: 22px;
        }

        /* DOCUMENT INFO */

        .document-info {
          min-width: 0;
        }

        .document-info strong {
          display: block;
          margin-bottom: 5px;
          color: #202939;
          font-size: 14px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .document-info span {
          display: block;
          color: #687386;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .document-info small {
          display: block;
          margin-top: 5px;
          color: #9aa3b2;
          font-size: 11px;
        }

        /* ACTIONS */

        .document-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .document-view-btn,
        .document-delete-btn {
          height: 36px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition:
            background 0.15s,
            border-color 0.15s,
            transform 0.15s;
          box-sizing: border-box;
        }

        .document-view-btn {
          border: 1px solid #dce3f2;
          background: #f7f9ff;
          color: #3157d5;
        }

        .document-view-btn:hover {
          background: #eef2ff;
          transform: translateY(-1px);
        }

        .document-delete-btn {
          border: 1px solid #f0d7d7;
          background: #fff8f8;
          color: #c44949;
        }

        .document-delete-btn:hover {
          background: #fff0f0;
          border-color: #e9bebe;
          transform: translateY(-1px);
        }

        /* EMPTY / LOADING */

        .documents-empty {
          margin: 0;
          padding: 42px 20px;
          text-align: center;
          color: #8b95a5;
          font-size: 13px;
        }

        /* TABLET */

        @media (max-width: 900px) {
          .document-form-grid {
            grid-template-columns: 1fr 1fr;
          }

          .document-file-group {
            grid-column: 1 / -1;
          }
        }

        /* MOBILE */

        @media (max-width: 680px) {
          .documents-page {
            padding: 16px;
          }

          .documents-header {
            margin-bottom: 18px;
          }

          .documents-title-icon {
            width: 46px;
            height: 46px;
            font-size: 21px;
          }

          .documents-header h2 {
            font-size: 22px;
          }

          .documents-header p {
            font-size: 12px;
          }

          .document-upload-card,
          .document-list-header {
            padding: 18px;
          }

          .document-form-grid {
            grid-template-columns: 1fr;
          }

          .document-file-group {
            grid-column: auto;
          }

          .documents-list {
            padding: 6px 18px 12px;
          }

          .document-item {
            grid-template-columns: 42px minmax(0, 1fr);
            gap: 12px;
          }

          .document-icon {
            width: 42px;
            height: 42px;
          }

          .document-actions {
            grid-column: 2;
          }

          .document-view-btn,
          .document-delete-btn {
            flex: 1;
          }

          .document-upload-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="documents-page">
        <div className="documents-shell">

          {/* HEADER */}

          <div className="documents-header">
            <div className="documents-title-wrap">
              <div className="documents-title-icon">
                📁
              </div>

              <div>
                <h2>Company Documents</h2>

                <p>
                  Manage documents that are available to all employees.
                </p>
              </div>
            </div>
          </div>

          {/* UPLOAD CARD */}

          <div className="document-upload-card">

            <div className="card-heading">
              <div className="card-heading-icon">
                ↥
              </div>

              <div>
                <h3>Upload Document</h3>

                <p>
                  Add a new company document to the employee portal.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpload}>

              <div className="document-form-grid">

                {/* DOCUMENT NAME */}

                <div className="form-group">

                  <label>
                    Document Name
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Leave Policy 2026"
                    value={documentName}
                    onChange={(e) =>
                      setDocumentName(e.target.value)
                    }
                  />

                </div>

                {/* DOCUMENT TYPE */}

                <div className="form-group">

                  <label>
                    Document Type
                  </label>

                  <select
                    value={documentType}
                    onChange={(e) =>
                      setDocumentType(e.target.value)
                    }
                  >
                    <option value="">
                      Select type
                    </option>

                    <option value="Policy">
                      Policy
                    </option>

                    <option value="Circular">
                      Circular
                    </option>

                    <option value="Notice">
                      Notice
                    </option>

                    <option value="Holiday List">
                      Holiday List
                    </option>

                    <option value="Company Document">
                      Company Document
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>

                </div>

                {/* FILE */}

                <div className="form-group document-file-group">

                  <label>
                    Select File
                  </label>

                  <div className="file-picker">

                    <input
                      id="document-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />

                  </div>

                  <small>
                    PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG or PNG
                    — max 10 MB
                  </small>

                  {file && (
                    <div className="selected-file">
                      ✓{" "}
                      <strong>
                        {file.name}
                      </strong>
                    </div>
                  )}

                </div>

              </div>

              {/* UPLOAD BUTTON */}

              <button
                type="submit"
                className="document-upload-btn"
                disabled={loading}
              >
                {loading
                  ? "Uploading..."
                  : "Upload Document"}
              </button>

            </form>

          </div>

          {/* DOCUMENT LIST */}

          <div className="document-list-card">

            <div className="document-list-header">

              <div className="list-title">

                <div className="list-title-icon">
                  ☷
                </div>

                <div>
                  <h3>
                    Uploaded Documents
                  </h3>

                  <p>
                    These documents are visible to all employees.
                  </p>
                </div>

              </div>

              <span className="document-count">
                {documents.length}
              </span>

            </div>

            {/* LOADING */}

            {fetching ? (

              <p className="documents-empty">
                Loading documents...
              </p>

            ) : documents.length === 0 ? (

              <p className="documents-empty">
                No documents uploaded yet.
              </p>

            ) : (

              <div className="documents-list">

                {documents.map((doc) => {

                  const excel =
                    isExcelFile(
                      doc.originalFileName
                    );

                  return (

                    <div
                      className="document-item"
                      key={doc.id}
                    >

                      {/* ICON */}

                      <div className="document-icon">
                        {excel
                          ? "📊"
                          : "📄"}
                      </div>

                      {/* INFORMATION */}

                      <div className="document-info">

                        <strong>
                          {doc.documentName}
                        </strong>

                        <span>
                          {doc.documentType ||
                            "Document"}

                          {" • "}

                          {doc.originalFileName}
                        </span>

                        <small>
                          Uploaded{" "}
                          {doc.createdAt
                            ? new Date(
                                doc.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </small>

                      </div>

                      {/* ACTIONS */}

                      <div className="document-actions">

                        {excel ? (

                          <a
                            href={getFileUrl(
                              doc.filePath
                            )}
                            className="document-view-btn"
                            download={
                              doc.originalFileName
                            }
                          >
                            Download
                          </a>

                        ) : (

                          <a
                            href={getFileUrl(
                              doc.filePath
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="document-view-btn"
                          >
                            View
                          </a>

                        )}

                        <button
                          type="button"
                          className="document-delete-btn"
                          onClick={() =>
                            handleDelete(
                              doc.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  );
                })}

              </div>

            )}

          </div>

        </div>
      </div>
    </>
  );
};

export default AdminDocuments;