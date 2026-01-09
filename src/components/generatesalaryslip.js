import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GenerateSalarySlip = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [employeeUuid, setEmployeeUuid] = useState("");
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= EMPLOYEE ================= */
  const [emp, setEmp] = useState({
    name: "",
    employeeId: "",
    department: "",
    role: "",
    joinDate: "",
    bankName: "",
    accountNo: "",
    pfNo: "",
    pan: ""
  });

  /* ================= SALARY ================= */
  const [salary, setSalary] = useState({
    basic: "",
    hra: 0,
    professionalDevelopment: 0,
    specialAllowance: 0,
    cca: 0,
    projectBonus: 0,
    additionalBonus: 0,
    incomeTax: 0,
    educationCess: 0,
    professionTax: 200
  });

  /* ---------------- Load Employees ---------------- */
  useEffect(() => {
    async function loadEmployees() {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    }
    loadEmployees();
  }, []);

  /* ---------------- Select Employee ---------------- */
  const handleEmployeeSelect = async (uuid) => {
    if (!uuid) return;

    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:5000/api/employees/${uuid}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const e = await res.json();
    setEmployeeUuid(uuid);

    setEmp({
      name: e.name || "",
      employeeId: e.employeeId || "",
      department: e.department || "",
      role: e.role || "",
      joinDate: e.joinDate || "",
      bankName: e.bankName || "",
      accountNo: e.accountNo || "",
      pfNo: e.pfNo || "",
      pan: e.pan || ""
    });
  };

  /* ---------------- Auto Calculate ---------------- */
  useEffect(() => {
    const B = Number(salary.basic);
    if (!B || B <= 0) return;

    setSalary(prev => ({
      ...prev,
      hra: B * 0.5,
      professionalDevelopment: B * 0.2,
      specialAllowance: B * 0.3,
      cca: B * 0.2,
      projectBonus: B * 0.3
    }));
  }, [salary.basic]);

  const totalEarnings =
    Number(salary.basic) +
    salary.hra +
    salary.professionalDevelopment +
    salary.specialAllowance +
    salary.cca +
    salary.projectBonus +
    salary.additionalBonus;

  const totalDeductions =
    salary.incomeTax +
    salary.educationCess +
    salary.professionTax;

  const netPay = totalEarnings - totalDeductions;

  /* ---------------- Submit ---------------- */
  const submitSlip = async () => {
    if (!employeeUuid || !month || netPay < 0) {
      alert("Invalid data");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/payroll/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        employeeUuid,
        month,
        employee: emp,
        salary: {
          ...salary,
          totalEarnings,
          totalDeductions,
          netPay
        }
      })
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert("Payslip generated successfully 🎉");
      navigate("/app/payroll");
    } else {
      alert(data.message || "Failed to generate payslip");
    }
  };

  return (
    <div className="salary-page">
      <h2 className="page-title">Generate Salary Slip</h2>

      {/* ================= BASIC INFO ================= */}
      <div className="card">
        <div className="row">
          <div>
            <label>Employee</label>
            <select onChange={e => handleEmployeeSelect(e.target.value)}>
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Salary Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ================= EMPLOYEE DETAILS ================= */}
      <div className="card">
        <h3>Employee Details</h3>
        <div className="grid">
          {["name","employeeId","department","role","joinDate"].map(f => (
            <div key={f}>
              <label>{f}</label>
              <input
                value={emp[f]}
                onChange={e => setEmp({ ...emp, [f]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ================= BANK DETAILS ================= */}
      <div className="card">
        <h3>Bank Details</h3>
        <div className="grid">
          {["bankName","accountNo","pfNo","pan"].map(f => (
            <div key={f}>
              <label>{f}</label>
              <input
                value={emp[f]}
                onChange={e => setEmp({ ...emp, [f]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ================= SALARY STRUCTURE ================= */}
      <div className="card">
        <h3>Salary Structure</h3>

        <table className="salary-table">
          <thead>
            <tr>
              <th>Particular</th>
              <th>Monthly Amount</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Basic Salary","basic"],
              ["HRA","hra"],
              ["Professional Development","professionalDevelopment"],
              ["Special Allowance","specialAllowance"],
              ["City Compensatory Allowance","cca"],
              ["Project Bonus","projectBonus"],
              ["Additional Bonus","additionalBonus"]
            ].map(([label,key]) => (
              <tr key={key}>
                <td>{label}</td>
                <td>
                  <input
                    type="number"
                    value={salary[key]}
                    onChange={e => setSalary({ ...salary, [key]: Number(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= DEDUCTIONS ================= */}
      <div className="card">
        <h3>Deductions</h3>
        <div className="grid">
          {[
            ["Income Tax","incomeTax"],
            ["Education Cess","educationCess"],
            ["Profession Tax","professionTax"]
          ].map(([label,key]) => (
            <div key={key}>
              <label>{label}</label>
              <input
                type="number"
                value={salary[key]}
                onChange={e => setSalary({ ...salary, [key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="card summary">
        <p><b>Total Earnings:</b> ₹{totalEarnings}</p>
        <p><b>Total Deductions:</b> ₹{totalDeductions}</p>
        <p className="net"><b>Net Pay:</b> ₹{netPay}</p>
      </div>
<div>
      <button className="generate-btn" disabled={loading || netPay < 0} onClick={submitSlip}>
        {loading ? "Generating..." : "Generate Payslip"}
      </button>
      </div>
    </div>
  );
};

export default GenerateSalarySlip;
