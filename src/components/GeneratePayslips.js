import React, { useEffect, useState } from "react";

/* MONTH LIST (DATA ONLY, NOT LOGIC) */
const MONTHS = [
  { name: "Jan", value: 1 },
  { name: "Feb", value: 2 },
  { name: "Mar", value: 3 },
  { name: "Apr", value: 4 },
  { name: "May", value: 5 },
  { name: "Jun", value: 6 },
  { name: "Jul", value: 7 },
  { name: "Aug", value: 8 },
  { name: "Sep", value: 9 },
  { name: "Oct", value: 10 },
  { name: "Nov", value: 11 },
  { name: "Dec", value: 12 }
];

/* 🔹 GENERIC MONTH RANGE CHECK */
const isMonthInRange = (month, from, to) => {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
};

const GeneratePayslip = () => {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [loading, setLoading] = useState(false);

  const [variableBonuses, setVariableBonuses] = useState([
    { amount: "", months: [] }
  ]);

  /* LOAD EMPLOYEES */
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/employee", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setEmployees)
      .catch(console.error);
  }, []);

  /* BONUS ROW HANDLERS */
  const addBonusRow = () =>
    setVariableBonuses([...variableBonuses, { amount: "", months: [] }]);

  const removeBonusRow = (index) =>
    setVariableBonuses(variableBonuses.filter((_, i) => i !== index));

  const updateAmount = (index, value) => {
    const copy = [...variableBonuses];
    copy[index].amount = value;
    setVariableBonuses(copy);
  };

  const toggleMonth = (index, month) => {
    const copy = [...variableBonuses];
    copy[index].months = copy[index].months.includes(month)
      ? copy[index].months.filter(m => m !== month)
      : [...copy[index].months, month];
    setVariableBonuses(copy);
  };

  /* VARIABLE BONUS PREVIEW */
  const calculateVariableBonus = () => {
    if (!fromMonth || !toMonth) return 0;

    const from = Number(fromMonth.split("-")[1]);
    const to = Number(toMonth.split("-")[1]);

    return variableBonuses.reduce((total, bonus) => {
      const amt = Number(bonus.amount || 0);
      const applicableMonths = bonus.months.filter(m =>
        isMonthInRange(m, from, to)
      );
      return total + applicableMonths.length * amt;
    }, 0);
  };

  /* GENERATE PAYSLIP */
  const generatePayslip = async () => {
  if (!employeeId || !fromMonth || !toMonth) {
    alert("Please select employee and month range");
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("token");

    // ✅ SEND EVERYTHING IN BODY (FIX)
    const payload = {
      employeeId,
      fromMonth,
      toMonth,
      variableBonuses: variableBonuses.map(b => ({
        amount: Number(b.amount || 0),
        months: b.months
      }))
    };

    const res = await fetch(
      "http://localhost:5000/api/salary-slip/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) throw new Error();

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${employeeId}-${fromMonth}-to-${toMonth}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Payslip generation failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: 20 }}>
      <h2>Generate Payslip</h2>

      <label>Employee</label><br />
      <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
        <option value="">Select Employee</option>
        {employees.map(emp => (
          <option key={emp.employeeId} value={emp.employeeId}>
            {emp.employeeId} - {emp.name}
          </option>
        ))}
      </select>

      <br /><br />

      <label>From Month</label><br />
      <input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} />

      <br /><br />

      <label>To Month</label><br />
      <input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} />

      <hr />

      <h3>Variable Bonus</h3>

      {variableBonuses.map((row, idx) => (
        <div key={idx} style={{ border: "1px solid #ccc", padding: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <label>Bonus</label>
            <input
              type="number"
              value={row.amount}
              onChange={e => updateAmount(idx, e.target.value)}
              style={{ width: 100 }}
            />
            <button type="button" onClick={addBonusRow}>+</button>
            {variableBonuses.length > 1 && (
              <button type="button" onClick={() => removeBonusRow(idx)}>-</button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(45px, auto))", gap: 6 }}>
            {MONTHS.map(m => (
              <label key={m.value} style={{ display: "flex", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={row.months.includes(m.value)}
                  onChange={() => toggleMonth(idx, m.value)}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>
      ))}

      <p><strong>Total Variable Bonus:</strong> ₹{calculateVariableBonus()}</p>

      <button onClick={generatePayslip} disabled={loading}>
        {loading ? "Generating..." : "Generate Payslip"}
      </button>
    </div>
  );
};

export default GeneratePayslip;
