import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Payroll = () => {
  const navigate = useNavigate();
  const [slips, setSlips] = useState([]);

  // ------------------------------------------------
  // LOAD PAYSLIPS
  // ------------------------------------------------
  const loadSlips = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/payroll/slips", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setSlips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load slips error:", err);
      setSlips([]);
    }
  };

  useEffect(() => {
    loadSlips();
  }, []);

  // ------------------------------------------------
  // DOWNLOAD PAYSLIP
  // ------------------------------------------------
  const downloadSlip = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/payroll/download/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        alert("Failed to download payslip");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "SalarySlip.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Download slip error:", err);
      alert("Download failed");
    }
  };

  // ------------------------------------------------
  // DELETE PAYSLIP
  // ------------------------------------------------
  const deleteSlip = async (id) => {
    if (!window.confirm("Are you sure you want to delete this salary slip?"))
      return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/payroll/${id}`, // ✅ CORRECT URL
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.message || "Failed to delete payslip");
        return;
      }

      alert("Payslip deleted successfully");
      loadSlips(); // refresh list
    } catch (err) {
      console.error("Delete slip error:", err);
      alert("Network error — could not delete payslip");
    }
  };

  return (
    <div className="salary-page">
      <h2 className="page-title">Payroll & Salary Slips</h2>

      <div className="salary-card">
        <div className="card-header">
          <h3>Salary Slip List</h3>

          <button
            className="generate-btn"
            onClick={() => navigate("/app/payroll/generate")}
          >
            + Generate Salary Slip
          </button>
        </div>

        <table className="salary-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Month</th>
              <th>Net Salary</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(slips) && slips.length > 0 ? (
              slips.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.month}</td>
                  <td>₹{s.netPay}</td>

                  <td className="actions">
                    {/* DOWNLOAD */}
                    <span
                      className="icon"
                      title="Download Slip"
                      onClick={() => downloadSlip(s._id)}
                    >
                      📥
                    </span>

                    {/* DELETE */}
                    <span
                      className="icon"
                      title="Delete Slip"
                      style={{ color: "red", marginLeft: 10 }}
                      onClick={() => deleteSlip(s._id)}
                    >
                      🗑️
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No salary slips found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;
