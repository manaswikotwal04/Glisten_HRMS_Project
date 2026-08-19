import React, { useEffect, useMemo, useState } from "react";

/* =====================================================
   MONTHS
===================================================== */

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

/* =====================================================
   GET DATE KEY
===================================================== */

const getDateKey = (date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   GET WEEK NUMBER
===================================================== */

const getWeekNumber = (date) => {
  const temp = new Date(date);

  temp.setHours(0, 0, 0, 0);

  temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));

  const yearStart = new Date(temp.getFullYear(), 0, 1);

  return Math.ceil(((temp - yearStart) / 86400000 + 1) / 7);
};

/* =====================================================
   NORMALIZE DATABASE DATE
===================================================== */

const normalizeDate = (value) => {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return getDateKey(date);
};

/* =====================================================
   HOURS MANAGEMENT
===================================================== */

const HoursManagement = () => {
  /* =====================================================
     CURRENT DATE
  ===================================================== */

  const today = new Date();

  const currentYear = today.getFullYear();

  const currentMonth = today.getMonth() + 1;

  const currentWeek = getWeekNumber(today);

  /* =====================================================
     PREVIOUS MONTH
  ===================================================== */

  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  /* =====================================================
     FILTER STATE

     DEFAULT:
     Current Month
     Current Week
  ===================================================== */

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  /* =====================================================
     ATTENDANCE

     OPTIMIZED ARRAY

     [
       ["2026-08-10", 1],
       ["2026-08-11", 0],
       ["2026-08-12", 1]
     ]

     1 = Worked
     0 = Not Worked
  ===================================================== */

  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(false);

  /* =====================================================
     LOAD ATTENDANCE
  ===================================================== */

  const loadAttendance = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session expired. Please login again.");

        return;
      }

      const params = new URLSearchParams();

      params.append("year", selectedYear);

      if (selectedMonth !== "all") {
        params.append("month", selectedMonth);
      }

      if (selectedWeek !== "all") {
        params.append("week", selectedWeek);
      }

      const res = await fetch(
        `/api/attendance/my?${params.toString()}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,

            "Content-Type": "application/json",
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load attendance");
      }

      /* =================================================
         OPTIMIZE RESPONSE

         Instead of storing the complete object:

         {
           id,
           employeeId,
           attendanceDate,
           worked,
           hours,
           ...
         }

         Store only:

         [
           ["2026-08-14", 1]
         ]
      ================================================= */

      const optimizedData = Array.isArray(data)
        ? data
            .map((item) => {
              const date = normalizeDate(item.attendanceDate);

              if (!date) {
                return null;
              }

              return [date, item.worked ? 1 : 0];
            })
            .filter(Boolean)
        : [];

      setAttendance(optimizedData);
    } catch (error) {
      console.error("Attendance error:", error);

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
  }, [selectedYear, selectedMonth, selectedWeek]);

  /* =====================================================
     ATTENDANCE LOOKUP

     Main data remains an ARRAY.

     This object is only a temporary
     fast lookup structure.

     Example:

     {
       "2026-08-10": 1,
       "2026-08-11": 0
     }
  ===================================================== */

  const attendanceLookup = useMemo(() => {
    const lookup = {};

    attendance.forEach(([date, worked]) => {
      lookup[date] = worked;
    });

    return lookup;
  }, [attendance]);

  /* =====================================================
     GENERATE DAYS
  ===================================================== */

  const days = useMemo(() => {
    let startDate;
    let endDate;

    /* ================= CURRENT / SELECTED MONTH ================= */

    if (selectedMonth !== "all") {
      const month = Number(selectedMonth);

      startDate = new Date(selectedYear, month - 1, 1);

      endDate = new Date(selectedYear, month, 0);
    } else {

    /* ================= ALL MONTHS ================= */
      startDate = new Date(selectedYear, 0, 1);

      endDate = new Date(selectedYear, 11, 31);
    }

    const result = [];

    const current = new Date(startDate);

    while (current <= endDate) {
      const week = getWeekNumber(current);

      if (selectedWeek === "all" || week === Number(selectedWeek)) {
        result.push(new Date(current));
      }

      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [selectedYear, selectedMonth, selectedWeek]);

  /* =====================================================
     CHECK / UNCHECK ATTENDANCE
  ===================================================== */

  const toggleAttendance = async (date) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session expired. Please login again.");

        return;
      }

      const dateKey = getDateKey(date);

      /* =================================================
           GET EXISTING STATUS

           1 = Worked
           0 / undefined = Not Worked
        ================================================= */

      const existingWorked = attendanceLookup[dateKey];

      /* =================================================
           TOGGLE

           Existing 1 → 0
           Existing 0 → 1
        ================================================= */

      const worked = existingWorked === 1 ? false : true;

      const res = await fetch("/api/attendance/mark", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          attendanceDate: dateKey,

          worked: worked,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update attendance");
      }

      /*
          Reload attendance after update.
        */

      await loadAttendance();
    } catch (error) {
      console.error("Attendance update error:", error);

      alert(error.message || "Failed to update attendance");
    }
  };

  /* =====================================================
     TOTAL HOURS

     No need to store hours.

     1 worked day = 8 hours
  ===================================================== */

  const totalHours = days.reduce((total, date) => {
    const worked = attendanceLookup[getDateKey(date)] === 1;

    return total + (worked ? 8 : 0);
  }, 0);

  /* =====================================================
     TOTAL WORKED DAYS
  ===================================================== */

  const workedDays = days.filter(
    (date) => attendanceLookup[getDateKey(date)] === 1,
  ).length;

  /* =====================================================
     RESET TO CURRENT WEEK
  ===================================================== */

  const showCurrentWeek = () => {
    setSelectedYear(currentYear);

    setSelectedMonth(currentMonth);

    setSelectedWeek(currentWeek);
  };

  /* =====================================================
     MONTH OPTIONS

     ONLY CURRENT + PREVIOUS MONTH
  ===================================================== */

  const monthOptions = [
    {
      value: currentMonth,
      label: `${MONTHS[currentMonth - 1].name} ${currentYear}`,
    },

    {
      value: previousMonth,
      label: `${MONTHS[previousMonth - 1].name} ${previousMonthYear}`,
    },
  ];

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
        {/* =================================================
            HEADER
        ================================================= */}

        <h2>Hours Management</h2>

        <p className="subtitle">
          Mark your working days. Each checked day counts as 8 hours.
        </p>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {/* ================= MONTH ================= */}

          <div className="form-field">
            <label>Month</label>

            <select
              value={selectedMonth}
              onChange={(e) => {
                const value = Number(e.target.value);

                setSelectedMonth(value);

                /*
                  If previous month is selected,
                  use previous month's year.
                */

                if (value === previousMonth) {
                  setSelectedYear(previousMonthYear);
                } else {
                  setSelectedYear(currentYear);
                }

                /*
                  When month changes,
                  show all weeks first.
                */

                setSelectedWeek("all");
              }}
            >
              {monthOptions.map((month) => (
                <option
                  key={`${month.value}-${month.label}`}
                  value={month.value}
                >
                  {month.label}
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
            marginBottom: "30px",
          }}
        >
          {/* ================= WORKED DAYS ================= */}

          <div
            style={{
              padding: "20px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
            }}
          >
            <span>Worked Days</span>

            <h2>{workedDays}</h2>
          </div>

          {/* ================= TOTAL HOURS ================= */}

          <div
            style={{
              padding: "20px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
            }}
          >
            <span>Total Hours</span>

            <h2>{totalHours} hrs</h2>
          </div>
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        {loading ? (
          <p>Loading attendance...</p>
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
              }}
            >
              <thead>
                <tr>
                  <th>Date</th>

                  <th>Day</th>

                  <th>Week</th>

                  <th>Worked</th>

                  <th>Hours</th>
                </tr>
              </thead>

              <tbody>
                {days.map((date) => {
                  const key = getDateKey(date);

                  const worked = attendanceLookup[key] === 1;

                  return (
                    <tr key={key}>
                      {/* DATE */}

                      <td>{date.toLocaleDateString("en-IN")}</td>

                      {/* DAY */}

                      <td>
                        {date.toLocaleDateString("en-IN", {
                          weekday: "long",
                        })}
                      </td>

                      {/* WEEK */}

                      <td>Week {getWeekNumber(date)}</td>

                      {/* CHECKBOX */}

                      <td>
                        <input
                          type="checkbox"
                          checked={worked}
                          onChange={() => toggleAttendance(date)}
                        />
                      </td>

                      {/* HOURS */}

                      <td>
                        <strong>{worked ? 8 : 0} hrs</strong>
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

export default HoursManagement;


