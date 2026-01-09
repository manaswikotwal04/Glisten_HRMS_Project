import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const EmployeePayslips = () => {
  const { id } = useParams();
  const [slips, setSlips] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    async function loadSlips() {
      const res = await fetch(
        `http://localhost:5000/api/payroll/employee/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setSlips(data || []);
    }

    loadSlips();
  }, [id]);

  const downloadSlip = async (sid) => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:5000/api/payroll/download/${sid}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "SalarySlip.pdf";
    a.click();
  };

  return (
    <div className="salary-page">
      <h2 className="page-title">My Payslips</h2>

      <table className="salary-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Net Salary</th>
            <th>Download</th>
          </tr>
        </thead>

        <tbody>
          {slips.map(s => (
            <tr key={s._id}>
              <td>{s.month}</td>
              <td>₹{s.netPay}</td>
              <td>
                <button onClick={() => downloadSlip(s._id)}>📥</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeePayslips;
