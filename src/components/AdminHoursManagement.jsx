import React, { useEffect, useMemo, useState } from "react";


const MONTHS = [
  { name: "January", value: 1 },
  { name: "February", value: 2 },
  { name: "March", value: 3 },
  { name: "April", value: 4 },
  { name: "May", value: 5 },
  { name: "June", value: 6 },
  { name: "July", value: 7 },
  { name: "August", value: 8 },
  { name: "September", value: 9 },
  { name: "October", value: 10 },
  { name: "November", value: 11 },
  { name: "December", value: 12 },
];
const getWeekNumber = (date) => {
  const temp = new Date(date);

  temp.setHours(0, 0, 0, 0);

  temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));

  const yearStart = new Date(temp.getFullYear(), 0, 1);

  return Math.ceil(((temp - yearStart) / 86400000 + 1) / 7);
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   ADMIN HOURS MANAGEMENT
===================================================== */

const AdminHoursManagement = () => {
  const today = new Date();

  const currentYear = today.getFullYear();

  const currentMonth = today.getMonth() + 1;

  const currentWeek = getWeekNumber(today);

  const [selectedEmployee, setSelectedEmployee] = useState("all");

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const [employees, setEmployees] = useState([]);

  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(false);

  const years = useMemo(() => {
    return Array.from(
      {
        length: 3,
      },
      (_, index) => currentYear - 2 + index,
    );
  }, [currentYear]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/employee", {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load employees");
        }

        setEmployees(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Employee loading error:", error);
      }
    };

    loadEmployees();
  }, []);

  /* =====================================================
     LOAD ATTENDANCE
  ===================================================== */

  const loadAttendance = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const params = new URLSearchParams();

      /* ================= YEAR ================= */

      params.append("year", selectedYear);

      /* ================= EMPLOYEE ================= */

      if (selectedEmployee !== "all") {
        params.append("employeeId", selectedEmployee);
      }

      /* ================= MONTH ================= */

      if (selectedMonth !== "all") {
        params.append("month", selectedMonth);
      }

      /* ================= WEEK ================= */

      if (selectedWeek !== "all") {
        params.append("week", selectedWeek);
      }

      const res = await fetch(
        `http://localhost:5000/api/attendance/all?${params.toString()}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load attendance");
      }

      setAttendance(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Admin attendance error:", error);

      alert(error.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOAD WHEN FILTER CHANGES
  ===================================================== */

  useEffect(() => {
    loadAttendance();
  }, [selectedYear, selectedMonth, selectedWeek, selectedEmployee]);

  /* =====================================================
     TOTAL HOURS
  ===================================================== */

  const totalHours = attendance.reduce((total, item) => {
    return total + Number(item.hours || 0);
  }, 0);

  /* =====================================================
     TOTAL WORKED DAYS
  ===================================================== */

  const workedDays = attendance.filter((item) => Boolean(item.worked)).length;

  /* =====================================================
     RESET TO CURRENT WEEK
  ===================================================== */

  const showCurrentWeek = () => {
    setSelectedYear(currentYear);

    setSelectedMonth(currentMonth);

    setSelectedWeek(currentWeek);
  };

  /* =====================================================
     YEAR CHANGE
  ===================================================== */

  const handleYearChange = (value) => {
    const year = Number(value);

    setSelectedYear(year);

    /*
      If current year is selected,
      show current month/current week.
    */

    if (year === currentYear) {
      setSelectedMonth(currentMonth);

      setSelectedWeek(currentWeek);
    } else {
      /*
        For older years,
        don't force the current
        month/week.
      */

      setSelectedMonth("all");

      setSelectedWeek("all");
    }
  };

  const handleMonthChange = (value) => {
    setSelectedMonth(value);

    setSelectedWeek("all");
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "30px",
        boxSizing: "border-box",
        background: "#f8fafc",
      }}
    >
      <div
        className="add-employee-card"
        style={{
          width: "100%",
          maxWidth: "none",
          boxSizing: "border-box",
        }}
      >
        <h2>Employee Hours</h2>

        <p className="subtitle">View employee attendance and working hours.</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {/* ================= EMPLOYEE ================= */}

          <div className="form-field">
            <label>Employee</label>

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="all">All Employees</option>

              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.employeeId}
                  {" - "}
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {/* ================= YEAR ================= */}

          <div className="form-field">
            <label>Year</label>

            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* ================= MONTH ================= */}

          <div className="form-field">
            <label>Month</label>

            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
            >
              <option value="all">All Months</option>

              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.name}
                </option>
              ))}
            </select>
          </div>

          {/* ================= WEEK ================= */}

          <div className="form-field">
            <label>Week</label>

            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              <option value="all">All Weeks</option>

              {Array.from(
                {
                  length: 53,
                },
                (_, index) => index + 1,
              ).map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>

          {/* ================= CURRENT WEEK ================= */}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <button
              type="button"
              className="add-btn"
              onClick={showCurrentWeek}
              style={{
                width: "100%",
                height: "42px",
              }}
            >
              Current Week
            </button>
          </div>
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          {/* WORKED DAYS */}

          <div
            style={{
              padding: "20px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
            }}
          >
            <span
              style={{
                color: "#6b7280",
              }}
            >
              Worked Days
            </span>

            <h2
              style={{
                margin: "8px 0 0",
              }}
            >
              {workedDays}
            </h2>
          </div>

          {/* TOTAL HOURS */}

          <div
            style={{
              padding: "20px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
            }}
          >
            <span
              style={{
                color: "#6b7280",
              }}
            >
              Total Hours
            </span>

            <h2
              style={{
                margin: "8px 0 0"
              }}
            >
              {totalHours} hrs
            </h2>
          </div>
        </div>
{loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            Loading attendance...
          </div>
        ) : attendance.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#6b7280",
              background: "#ffffff",
              borderRadius: "10px",
            }}
          >
            No attendance records found.
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <table
              className="employee-table"
              style={{
                width: "100%",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr>
                  <th>Employee ID</th>

                  <th>Employee Name</th>

                  <th>Date</th>

                  <th>Day</th>

                  <th>Week</th>

                  <th>Worked</th>

                  <th>Hours</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((item) => {
                  const dateString = normalizeDate(item.attendanceDate);

                  const date = dateString
                    ? new Date(`${dateString}T00:00:00`)
                    : null;

                  return (
                    <tr key={item.id}>
                      <td>{item.employeeId}</td>
                      <td>{item.employeeName || "-"}</td>
                      <td>{date ? date.toLocaleDateString("en-IN") : "-"}</td>

                      <td>
                        {date
                          ? date.toLocaleDateString("en-IN", {
                              weekday: "long",
                            })
                          : "-"}
                      </td>

                      <td>{date ? `Week ${getWeekNumber(date)}` : "-"}</td>

                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: "600",
                            background: item.worked ? "#dcfce7" : "#fee2e2",
                            color: item.worked ? "#166534" : "#991b1b",
                          }}
                        >
                          {item.worked ? "Yes" : "No"}
                        </span>
                      </td>

                      {/* HOURS */}

                      <td>
                        <strong>{Number(item.hours || 0)} hrs</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHoursManagement;


