import React, { useEffect, useMemo, useState } from "react";

const HoursManagement = () => {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [selectedWeek, setSelectedWeek] = useState(getISOWeek(today));

  const [days, setDays] = useState([]);

  const [myLeaves, setMyLeaves] = useState([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  /* =========================================================
     MONTHS
  ========================================================= */

  /* =========================================================
   LAST 2 MONTHS
========================================================= */

  const getLastTwoMonths = () => {
    const result = [];

    for (let i = 0; i < 2; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);

      result.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        value: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: date.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
    }

    return result;
  };

  const months = getLastTwoMonths();
  /* =========================================================
   GET WEEKS FOR SELECTED MONTH
========================================================= */

  const getWeeksForMonth = (year, month) => {
    const weeks = new Set();

    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);

      weeks.add(getISOWeek(date));
    }

    return Array.from(weeks).sort((a, b) => a - b);
  };
  /* =========================================================
     GET ISO WEEK
  ========================================================= */

  function getISOWeek(date) {
    const tempDate = new Date(date);

    tempDate.setHours(0, 0, 0, 0);

    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));

    const week1 = new Date(tempDate.getFullYear(), 0, 4);

    return (
      1 +
      Math.round(
        ((tempDate - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
      )
    );
  }

  /* =========================================================
     GET MONDAY OF ISO WEEK
  ========================================================= */

  function getMondayOfISOWeek(week, year) {
    const simple = new Date(year, 0, 4);

    const dayOfWeek = simple.getDay() || 7;

    const monday = new Date(simple);

    monday.setDate(simple.getDate() - dayOfWeek + 1);

    monday.setDate(monday.getDate() + (week - 1) * 7);

    return monday;
  }

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* =========================================================
     FORMAT DISPLAY DATE
  ========================================================= */

  const formatDisplayDate = (date) => {
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  /* =========================================================
     CHECK WFH
  ========================================================= */

  const isWorkFromHome = (leaveType) => {
    if (!leaveType) {
      return false;
    }

    const type = String(leaveType)
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");

    return (
      type === "wfh" || type === "work from home" || type === "workfromhome"
    );
  };
  const getLeaveForDate = (dateString) => {
    if (!dateString) {
      return null;
    }

    const currentDate = String(dateString).substring(0, 10);

    const leave = myLeaves.find((item) => {
      /*
       * WFH should NEVER lock attendance.
       */
      if (isWorkFromHome(item.leaveType)) {
        return false;
      }

      if (String(item.status).toLowerCase() !== "approved") {
        return false;
      }

      const fromDate = String(item.fromDate).substring(0, 10);

      const toDate = String(item.toDate).substring(0, 10);

      return currentDate >= fromDate && currentDate <= toDate;
    });

    return leave || null;
  };

  const createWeekDays = () => {
    const monday = getMondayOfISOWeek(selectedWeek, selectedYear);

    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);

      date.setDate(monday.getDate() + i);

      if (
        date.getMonth() + 1 !== Number(selectedMonth) ||
        date.getFullYear() !== Number(selectedYear)
      ) {
        continue;
      }

      const dateKey = formatDateForAPI(date);

      const leave = getLeaveForDate(dateKey);

      weekDays.push({
        date: dateKey,

        displayDate: formatDisplayDate(date),

        day: date.toLocaleDateString("en-US", {
          weekday: "long",
        }),

        week: selectedWeek,

        worked: false,

        hours: 0,

        leaveLocked: Boolean(leave),

        leaveType: leave?.leaveType || null,
      });
    }

    return weekDays;
  };

  const loadMyLeaves = async () => {
    if (!token) {
      return [];
    }

    try {
      const response = await fetch("/api/leave/my-leaves", {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Invalid leave response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load leaves");
      }

      const leaves = Array.isArray(data) ? data : [];

      setMyLeaves(leaves);

      return leaves;
    } catch (error) {
      console.log("LOAD LEAVES FAILED:", error);

      setMyLeaves([]);

      return [];
    }
  };

  const loadHours = async () => {
    if (!token) {
      alert("Authentication token not found.");

      return;
    }

    if (!selectedYear || !selectedMonth || !selectedWeek) {
      return;
    }

    try {
      setLoading(true);

      /*
       * IMPORTANT:
       * Load latest leave information
       * before generating the week.
       */
      const leaves = await loadMyLeaves();

      const url =
        `/api/attendance?year=${selectedYear}` +
        `&month=${selectedMonth}` +
        `&week=${selectedWeek}`;

      console.log("Loading attendance:", url);

      const response = await fetch(url, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid server response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to load attendance. Status: ${response.status}`,
        );
      }

      /*
       * Create week after leaves
       * have been loaded.
       */
      const weekDays = createWeekDays();

      /*
       * Attendance lookup.
       */
      const savedAttendance = new Map();

      if (Array.isArray(data)) {
        data.forEach((record) => {
          if (!record.attendanceDate) {
            return;
          }

          const dateKey = String(record.attendanceDate).substring(0, 10);

          savedAttendance.set(dateKey, record);
        });
      }

      /*
       * Merge attendance + leave.
       */
      const mergedDays = weekDays.map((day) => {
        const saved = savedAttendance.get(day.date);

        /*
         * Also check leave again
         * after fetching latest leaves.
         */
        const leave = leaves.find((item) => {
          if (isWorkFromHome(item.leaveType)) {
            return false;
          }

          if (String(item.status).toLowerCase() !== "approved") {
            return false;
          }

          const fromDate = String(item.fromDate).substring(0, 10);

          const toDate = String(item.toDate).substring(0, 10);

          return day.date >= fromDate && day.date <= toDate;
        });

        /*
         * No attendance saved.
         */
        if (!saved) {
          return {
            ...day,

            worked: false,

            hours: 0,

            leaveLocked: Boolean(leave),

            leaveType: leave?.leaveType || null,
          };
        }

        const worked =
          saved.worked === true ||
          saved.worked === 1 ||
          saved.worked === "1" ||
          saved.worked === "true";

        const savedHours =
          saved.hours === null ||
          saved.hours === undefined ||
          saved.hours === ""
            ? worked
              ? 8
              : 0
            : Number(saved.hours);

        return {
          ...day,

          id: saved.id,

          /*
           * If approved leave exists,
           * force attendance to locked.
           */
          worked: leave ? false : worked,

          hours: leave ? 0 : worked ? savedHours : 0,

          leaveLocked: Boolean(leave),

          leaveType: leave?.leaveType || null,
        };
      });

      console.log("MERGED DAYS:", mergedDays);

      setDays(mergedDays);
    } catch (error) {
      console.log("LOAD HOURS FAILED:", error);

      /*
       * Even if attendance API
       * fails, show week with
       * leave information.
       */
      await loadMyLeaves();

      setDays(createWeekDays());
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD WHEN FILTER CHANGES
  ========================================================= */

  useEffect(() => {
    loadHours();
  }, [selectedMonth, selectedYear, selectedWeek]);

  /* =========================================================
     CHECK / UNCHECK WORKED
  ========================================================= */

  const handleWorkedChange = (index) => {
    setDays((previousDays) =>
      previousDays.map((day, i) => {
        if (i !== index) {
          return day;
        }

        /*
         * Leave date cannot be edited.
         */
        if (day.leaveLocked) {
          return day;
        }

        const worked = !day.worked;

        return {
          ...day,

          worked,

          hours: worked ? day.hours || 8 : 0,
        };
      }),
    );
  };

  /* =========================================================
     CHANGE HOURS
  ========================================================= */

  const handleHoursChange = (index, value) => {
    setDays((previousDays) =>
      previousDays.map((day, i) => {
        if (i !== index) {
          return day;
        }

        /*
         * Approved leave
         * cannot be edited.
         */
        if (day.leaveLocked) {
          return day;
        }

        /*
         * Allow empty while typing.
         */
        if (value === "") {
          return {
            ...day,

            hours: "",
          };
        }

        let hours = Number(value);

        if (Number.isNaN(hours)) {
          return day;
        }

        if (hours < 0) {
          hours = 0;
        }

        if (hours > 24) {
          hours = 24;
        }

        return {
          ...day,

          hours,

          /*
           * Entering hours
           * automatically marks
           * worked.
           */
          worked: hours > 0 ? true : day.worked,
        };
      }),
    );
  };

  /* =========================================================
     TOTAL HOURS
  ========================================================= */

  const totalHours = useMemo(() => {
    return days.reduce((total, day) => {
      if (!day.worked) {
        return total;
      }

      return total + Number(day.hours || 0);
    }, 0);
  }, [days]);

  /* =========================================================
     WORKED DAYS
  ========================================================= */

  const workedDays = useMemo(() => {
    return days.filter((day) => day.worked).length;
  }, [days]);

  /* =========================================================
     LOCKED DAYS
  ========================================================= */

  const lockedDays = useMemo(() => {
    return days.filter((day) => day.leaveLocked).length;
  }, [days]);

  /* =========================================================
     CURRENT WEEK
  ========================================================= */

  const handleCurrentWeek = () => {
    const currentDate = new Date();

    setSelectedMonth(currentDate.getMonth() + 1);

    setSelectedYear(currentDate.getFullYear());

    setSelectedWeek(getISOWeek(currentDate));
  };

  /* =========================================================
     SUBMIT HOURS
  ========================================================= */

  const handleSubmit = async () => {
    if (!token) {
      alert("Authentication token not found.");

      return;
    }

    if (!days.length) {
      alert("No attendance days to submit.");

      return;
    }

    /*
     * Validate worked days.
     */
    const invalidDay = days.find((day) => {
      /*
       * Leave days are not
       * submitted as worked.
       */
      if (day.leaveLocked) {
        return false;
      }

      if (!day.worked) {
        return false;
      }

      const hours = Number(day.hours);

      return day.hours === "" || Number.isNaN(hours) || hours < 0 || hours > 24;
    });

    if (invalidDay) {
      alert(
        `Please enter valid hours for ${invalidDay.displayDate}. Hours must be between 0 and 24.`,
      );

      return;
    }

    /*
     * Send every visible day.
     *
     * Leave days are sent as
     * worked=false and hours=0.
     */
    const submitDays = days.map((day) => ({
      date: day.date,

      worked: day.leaveLocked ? false : Boolean(day.worked),

      hours: day.leaveLocked ? 0 : day.worked ? Number(day.hours || 0) : 0,
    }));

    const payload = {
      year: Number(selectedYear),

      month: Number(selectedMonth),

      week: Number(selectedWeek),

      days: submitDays,
    };

    console.log("================================");

    console.log("SUBMITTING ATTENDANCE");

    console.log("TOTAL DAYS:", submitDays.length);

    console.log(JSON.stringify(payload, null, 2));

    console.log("================================");

    try {
      setSaving(true);

      const response = await fetch("/api/attendance/submit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid server response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to submit hours. Status: ${response.status}`,
        );
      }

      alert(data.message || "Hours submitted successfully.");

      /*
       * Reload everything from database.
       */
      await loadHours();
    } catch (error) {
      console.log("SUBMIT HOURS FAILED:", error);

      alert(error.message || "Failed to submit hours.");
    } finally {
      setSaving(false);
    }
  };

  const weekOptions = getWeeksForMonth(selectedYear, selectedMonth);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="hours-management-page">
      <style>{`

        * {
          box-sizing: border-box;
        }
 .hours-management-page {
          width: 100%;
          min-height: 100vh;
          padding: 28px 24px;
          background: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
        }
        .hours-management-header {
          margin-bottom: 24px;
        }
        .hours-management-header h2 {
          margin: 0 0 10px;
          font-size: 28px;
          font-weight: 700;
          color: #111111;
        }
        .hours-management-header p {
          margin: 0;
          font-size: 15px;
          color: #64748b;
        }
        .hours-filter-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          margin-bottom: 28px;
        }
  .hours-filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
      }
        .hours-filter-group label {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }
        .hours-select {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          background: #ffffff;
          color: #111827;
          font-size: 15px;
          outline: none;
          cursor: pointer;
        }
        .hours-select:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 2px
            rgba(37, 99, 235, 0.12);
        }
        .current-week-button {
          height: 44px;
          margin-top: 27px;
          border: none;
          border-radius: 7px;
          background: #2563eb;
          color: #ffffff;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .current-week-button:hover {
          background: #1d4ed8;
        }
        .summary-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          margin-bottom: 42px;
        }
        .summary-card {
          min-height: 130px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
        }
        .summary-card-title {
          margin-bottom: 20px;
          font-size: 16px;
          color: #64748b;
        }
        .summary-card-value {
          font-size: 28px;
          font-weight: 700;
          color: #111111;
        }
        .hours-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        .hours-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
        }
        .hours-table th {
          padding: 14px 12px;
          border-bottom: 1px solid #dbe1e8;
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          color: #111111;
        }
        .hours-table td {
          padding: 13px 12px;
          border-bottom: 1px solid #e5e7eb;
          text-align: center;
          font-size: 16px;
          color: #111827;
        }
        .hours-table th:first-child,
        .hours-table td:first-child {
          text-align: left;
        }
        .hours-table tr.leave-row {
          background: #fff7f7;
        }
        .worked-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #2563eb;
        }
        .worked-checkbox:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
        .hours-input {
          width: 90px;
          height: 38px;
          padding: 0 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          text-align: center;
          font-size: 15px;
          outline: none;
          background: #ffffff;
        }

        .hours-input:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 2px
            rgba(37, 99, 235, 0.12);
        }

        .hours-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .leave-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 20px;
          background: #fee2e2;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 600;
        }

        .wfh-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 9px;
          border-radius: 20px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 600;
        }

        .leave-hour-value {
          color: #94a3b8;
          font-weight: 500;
        }

        .submit-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 26px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .submit-button {
          min-width: 170px;
          height: 44px;
          padding: 0 24px;
          border: none;
          border-radius: 7px;
          background: #2563eb;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 0.2s ease,
            opacity 0.2s ease;
        }

        .submit-button:hover {
          background: #1d4ed8;
        }

        .submit-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .loading-container {
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 15px;
        }

        .empty-week {
          padding: 35px;
          text-align: center;
          color: #64748b;
        }

        @media (max-width: 900px) {

          .hours-filter-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .current-week-button {
            margin-top: 0;
          }

          .summary-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }

        }

        @media (max-width: 600px) {

          .hours-management-page {
            padding: 20px 15px;
          }

          .hours-management-header h2 {
            font-size: 24px;
          }

          .submit-section {
            justify-content: stretch;
          }

          .submit-button {
            width: 100%;
          }

        }

      `}</style>

      <div className="hours-management-header">
        <h2>Hours Management</h2>

        <p>
          Mark your working days. Working hours are editable. Approved leave
          dates are locked.
        </p>
      </div>

      <div className="hours-filter-group">
        <label>Month</label>

        <select
          className="hours-select"
          value={`${selectedYear}-${selectedMonth}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split("-");

            const newYear = Number(year);
            const newMonth = Number(month);

            setSelectedYear(newYear);
            setSelectedMonth(newMonth);

            const availableWeeks = getWeeksForMonth(newYear, newMonth);

            setSelectedWeek(availableWeeks[0]);
          }}
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      <div className="hours-filter-group">
        <label>Week</label>

        <select
          className="hours-select"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
        >
          {weekOptions.map((week) => (
            <option key={week} value={week}>
              Week {week}
            </option>
          ))}
        </select>
      </div>

      {/* CURRENT WEEK */}

      <button
        type="button"
        className="current-week-button"
        onClick={handleCurrentWeek}
      >
        Current Week
      </button>
      <div
        className="summary-row"
        style={{
          marginTop: "25px",
        }}
      >
        <div className="summary-card">
          <div className="summary-card-title">Worked Days</div>

          <div className="summary-card-value">{workedDays}</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Total Hours</div>

          <div className="summary-card-value">
            {Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(2)}{" "}
            hrs
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Leave Locked</div>

          <div className="summary-card-value">{lockedDays}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">Loading hours...</div>
      ) : (
        <>
          {days.length === 0 ? (
            <div className="empty-week">
              No dates available for this month and week.
            </div>
          ) : (
            <div className="hours-table-wrapper">
              <table className="hours-table">
                <thead>
                  <tr>
                    <th>Date</th>

                    <th>Day</th>

                    <th>Week</th>

                    <th>Status</th>

                    <th>Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {days.map((day, index) => (
                    <tr
                      key={day.date}
                      className={day.leaveLocked ? "leave-row" : ""}
                    >
                      <td>{day.displayDate}</td>

                      <td>{day.day}</td>

                      <td>Week {day.week}</td>

                      <td>
                        {day.leaveLocked ? (
                          <span className="leave-badge">
                            🔒 {day.leaveType || "On Leave"}
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            className="worked-checkbox"
                            checked={Boolean(day.worked)}
                            disabled={day.leaveLocked}
                            onChange={() => handleWorkedChange(index)}
                          />
                        )}
                      </td>

                      <td>
                        {day.leaveLocked ? (
                          <span className="leave-hour-value">—</span>
                        ) : (
                          <input
                            type="number"
                            className="hours-input"
                            min="0"
                            max="24"
                            step="0.5"
                            value={day.hours}
                            disabled={!day.worked}
                            onChange={(e) =>
                              handleHoursChange(index, e.target.value)
                            }
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="submit-section">
            <button
              type="button"
              className="submit-button"
              onClick={handleSubmit}
              disabled={saving || loading}
            >
              {saving ? "Submitting..." : "Submit Hours"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HoursManagement;
