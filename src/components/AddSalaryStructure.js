import React, { useEffect, useState } from "react";

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14
};

const card = {
  padding: 18,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  marginBottom: 18,
  background: "#fafafa"
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14
};

const AddSalaryStructure = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    basic_salary: "",
    bonus: "",
    hra_pct: 50,
    pd_pct: 20,
    sa_pct: 30,
    cca_pct: 20,
    pb_pct: 0,
    pt_amt: "",
    it_amt: "",
    cess_amt: "",
    effective_from: ""
  });


  useEffect(() => {
    fetch("http://localhost:5000/api/employee")
      .then(res => res.json())
      .then(setEmployees)
      .catch(console.error);
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (Number(value) < 0) return;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const basic = Number(form.basic_salary || 0);
  const pct = (v) => (basic * Number(v || 0)) / 100;

  const preview = {
    hra: pct(form.hra_pct),
    pd: pct(form.pd_pct),
    sa: pct(form.sa_pct),
    cca: pct(form.cca_pct),
    pb: pct(form.pb_pct),
    pt: Number(form.pt_amt || 0),
    it: Number(form.it_amt || 0),
    cess: Number(form.cess_amt || 0)
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.employeeId || !form.basic_salary || !form.effective_from) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/salary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          basic_salary: Number(form.basic_salary),
          bonus: Number(form.bonus || 0),
          hra_pct: Number(form.hra_pct),
          pd_pct: Number(form.pd_pct),
          sa_pct: Number(form.sa_pct),
          cca_pct: Number(form.cca_pct),
          pb_pct: Number(form.pb_pct),
          pt_amt: Number(form.pt_amt || 0),
          it_amt: Number(form.it_amt || 0),
          cess_amt: Number(form.cess_amt || 0)
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      alert(data.message || "Salary structure saved successfully ✅");

      setForm({
        employeeId: "",
        basic_salary: "",
        bonus: "",
        hra_pct: 50,
        pd_pct: 20,
        sa_pct: 30,
        cca_pct: 20,
        pb_pct: 0,
        pt_amt: "",
        it_amt: "",
        cess_amt: "",
        effective_from: ""
      });

    } catch (err) {
      console.error(err);
      alert("Failed to save salary structure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-salary-scroll">
      <form onSubmit={submit} style={{ maxWidth: 720, margin: "auto" }}>
        <h2 style={{ marginBottom: 20 }}>Add Salary Structure</h2>

        {/* Employee */}
        <div style={card}>
          <h4>Employee Details</h4>

          <div style={grid2}>
            <div style={fieldStyle}>
              <label>Employee *</label>
              <select
                style={inputStyle}
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.employeeId} - {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label>Effective From *</label>
              <input
                style={inputStyle}
                type="date"
                name="effective_from"
                value={form.effective_from}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={grid2}>
            <div style={fieldStyle}>
              <label>Basic Salary (₹) *</label>
              <input
                style={inputStyle}
                type="number"
                name="basic_salary"
                value={form.basic_salary}
                onChange={handleChange}
                required
              />
            </div>

            <div style={fieldStyle}>
              <label>Fixed Bonus (₹)</label>
              <input
                style={inputStyle}
                type="number"
                name="bonus"
                value={form.bonus}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div style={card}>
          <h4>Earnings (%)</h4>
          <div style={grid2}>
            {["hra_pct","pd_pct","sa_pct","cca_pct","pb_pct"].map(key => (
              <div key={key} style={fieldStyle}>
                <label>{key.replace("_pct","").toUpperCase()} %</label>
                <input
                  style={inputStyle}
                  type="number"
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Deductions */}
        <div style={card}>
          <h4>Deductions (₹)</h4>
          <div style={grid2}>
            {["pt_amt","it_amt","cess_amt"].map(key => (
              <div key={key} style={fieldStyle}>
                <label>{key.replace("_amt","").toUpperCase()} (₹)</label>
                <input
                  style={inputStyle}
                  type="number"
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={card}>
          <h4>Live Monthly Preview</h4>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Earnings → HRA ₹{preview.hra.toFixed(2)}, PD ₹{preview.pd.toFixed(2)}, SA ₹{preview.sa.toFixed(2)}<br/>
            Deductions → PT ₹{preview.pt.toFixed(2)}, IT ₹{preview.it.toFixed(2)}, Cess ₹{preview.cess.toFixed(2)}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: 16,
            borderRadius: 6,
            border: "none",
            background: loading ? "#9ca3af" : "#2563eb",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          {loading ? "Saving..." : "Save Salary Structure"}
        </button>
      </form>
    </div>
  );
};

export default AddSalaryStructure;
