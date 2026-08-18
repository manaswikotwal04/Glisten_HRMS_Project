import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EmployeePayslips = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "employee") {
      navigate("/login", { replace: true });
      return;
    }

    fetch(`http://localhost:5000/api/salary-slip/employee/${employeeId}`)
      .then(res => res.json())
      .then(data => setPayslips(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [employeeId, navigate]);

  if (loading) {
    return <p style={{ padding: 30 }}>Loading payslips...</p>;
  }

  return (
    <div style={page}>
      <h2 style={title}>My Payslips</h2>

      {payslips.length === 0 ? (
        <div style={emptyBox}>No payslips available</div>
      ) : (
        <div style={card}>
          {/* Header */}
          <div style={tableHeader}>
            <span>Month</span>
            <span style={{ textAlign: "right" }}>Salary</span>
            <span style={{ textAlign: "center" }}>Actions</span>
          </div>

          {/* Rows */}
          {payslips.map(p => (
            <div key={p.id} style={row}>
              <div>
                <strong>{p.from_month}</strong> →{" "}
                <strong>{p.to_month}</strong>
              </div>

              <div style={{ textAlign: "right", fontWeight: 600 }}>
                ₹{Number(p.net_salary).toLocaleString("en-IN")}
              </div>

              <div style={{ textAlign: "center" }}>
                <a
                  href={`http://localhost:5000/${p.pdf_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={downloadBtn}
                >
                  ⬇ Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const page = {
  padding: 30,
  background: "#f8fafc",
  minHeight: "100vh"
};

const title = {
  marginBottom: 20,
  fontSize: 22,
  fontWeight: 600
};

const card = {
  background: "#ffffff",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr",
  padding: "10px 14px",
  fontWeight: 600,
  borderBottom: "1px solid #e5e7eb",
  marginBottom: 6
};

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr",
  padding: "12px 14px",
  alignItems: "center",
  borderRadius: 8,
  transition: "background 0.2s ease",
  marginBottom: 6,
  background: "#f9fafb"
};

const downloadBtn = {
  padding: "7px 16px",
  background: "#2563eb",
  color: "#fff",
  borderRadius: 8,
  fontSize: 13,
  textDecoration: "none",
  fontWeight: 500,
  display: "inline-block"
};

const emptyBox = {
  background: "#fff",
  padding: 30,
  borderRadius: 12,
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
  textAlign: "center",
  color: "#6b7280"
};

export default EmployeePayslips;


