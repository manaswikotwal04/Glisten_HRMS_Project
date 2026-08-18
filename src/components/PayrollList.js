import React, { useEffect, useState } from "react";

const PayrollList = () => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");

  const loadData = async () => {
    const res = await fetch("http://localhost:5000/api/salary-slip/list", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();


    const normalized = Array.isArray(data)
      ? data.map(r => ({
          ...r,
          employeeName: r.employeeName || r.employeeId,
          month: r.from_month === r.to_month
            ? r.from_month
            : `${r.from_month} → ${r.to_month}`
        }))
      : [];

    setRows(normalized);
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteSlip = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payslip?")) return;

    const res = await fetch(
      `http://localhost:5000/api/salary-slip/delete/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      console.warn("Failed to delete payslip");
      return;
    }

    loadData();
  };

  const filtered = rows.filter(r =>
    (r.employeeName || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.month || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "30px" }}>
      <h2 style={{ marginBottom: "20px" }}>Payroll & Salary Slips</h2>

      <div
        style={{
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          padding: "20px"
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px"
          }}
        >
          <input
            type="text"
            placeholder="Search by employee or month..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              width: "260px",
              borderRadius: "6px",
              border: "1px solid #ccc"
            }}
          />

          <button
            onClick={() => (window.location.href = "/app/generate-payslip")}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            + Generate Salary Slip
          </button>
        </div>

        {/* TABLE */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          }}
        >
          <thead>
            <tr style={{ background: "#f5f7fb", textAlign: "left" }}>
              <th style={th}>Employee</th>
              <th style={th}>Month</th>
              <th style={th}>Salary</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(row => (
              <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>{row.employeeName}</td>
                <td style={td}>{row.month}</td>
                <td style={td}>₹{Number(row.net_salary).toLocaleString()}</td>

                <td style={td}>
                  {/* DOWNLOAD */}
                 <a
  href={`http://localhost:5000/${row.pdf_path}`}
  target="_blank"
  rel="noopener noreferrer"
>
 📥 
</a>


                  {/* DELETE */}
                  <button
                    onClick={() => deleteSlip(row.id)}
                    title="Delete Payslip"
                    style={{
                      ...iconBtn,
                      color: "#dc2626"
                    }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                  No payslips found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ===== STYLES ===== */
const th = {
  padding: "12px",
  fontWeight: "600",
  color: "#374151"
};

const td = {
  padding: "12px",
  color: "#374151"
};

const iconBtn = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "16px",
  marginRight: "10px"
};

export default PayrollList;



