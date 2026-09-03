import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   DATE HELPERS
   ========================================================= */

const formatDateKey = (year, month, day) => {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
};

const normalizeApiDate = (value) => {
  if (!value) return "";

  const raw = String(value).trim();

  // DATE-only value: keep it exactly as it is.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const result = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  });

  if (!result.year || !result.month || !result.day) {
    return "";
  }

  return `${result.year}-${result.month}-${result.day}`;
};

/*
  Parse YYYY-MM-DD WITHOUT UTC conversion.
*/
const parseDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey).split("-").map(Number);

  return new Date(year, month - 1, day);
};

/*
  Add one local calendar day.
*/
const addOneDay = (dateKey) => {
  const date = parseDateKey(dateKey);

  date.setDate(date.getDate() + 1);

  return formatDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

/* =========================================================
   ISO WEEK
   ========================================================= */

const getISOWeek = (date) => {
  const tempDate = new Date(date);

  tempDate.setHours(0, 0, 0, 0);

  // Thursday determines ISO week year.
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));

  const week1 = new Date(tempDate.getFullYear(), 0, 4);

  return (
    1 +
    Math.round(
      ((tempDate - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  );
};

/* =========================================================
   MONDAY OF ISO WEEK
   ========================================================= */

const getMondayOfISOWeek = (week, year) => {
  const simple = new Date(year, 0, 4);

  const dayOfWeek = simple.getDay() || 7;

  const monday = new Date(simple);

  monday.setDate(simple.getDate() - dayOfWeek + 1);

  monday.setDate(monday.getDate() + (week - 1) * 7);

  monday.setHours(0, 0, 0, 0);

  return monday;
};

/* =========================================================
   WEEKS AVAILABLE IN A MONTH
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
   LEAVE HELPERS
   ========================================================= */

const getLeaveType = (leave) => {
  return String(
    leave?.leaveType || leave?.type || leave?.leave_type || "",
  ).trim();
};

/*
  Only APPROVED normal leaves lock attendance.

  WFH must NEVER lock attendance.
*/
const isLockingLeave = (leave) => {
  const status = String(leave?.status || "")
    .toLowerCase()
    .trim();

  const type = getLeaveType(leave).toLowerCase().trim();

  if (status !== "approved") {
    return false;
  }

  if (type.includes("wfh") || type.includes("work from home")) {
    return false;
  }

  return true;
};

/*
  Build:
  {
    "2026-08-25": "Casual Leave",
    "2026-08-26": "Casual Leave",
    "2026-08-27": "Casual Leave"
  }
*/
const buildLockedLeaveMap = (leaves) => {
  const lockedMap = {};

  if (!Array.isArray(leaves)) {
    return lockedMap;
  }

  leaves.forEach((leave) => {
    if (!isLockingLeave(leave)) {
      return;
    }

    const fromDate = normalizeApiDate(leave.fromDate);
    const toDate = normalizeApiDate(leave.toDate);

    if (!fromDate || !toDate) {
      return;
    }

    const leaveType = getLeaveType(leave) || "Approved Leave";

    let currentDate = fromDate;

    /*
      Expand inclusive date range.
      Example:
      25 -> 26 -> 27
    */
    while (currentDate <= toDate) {
      lockedMap[currentDate] = leaveType;

      if (currentDate === toDate) {
        break;
      }

      currentDate = addOneDay(currentDate);
    }
  });

  return lockedMap;
};

/* =========================================================
   COMPONENT
   ========================================================= */

const HoursManagement = () => {
  const today = new Date();

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentWeek = getISOWeek(today);

  /*
    Current month + previous month only.

    Example:
    September 2026
    August 2026

    January automatically becomes:
    January 2026
    December 2025
  */
  const monthOptions = useMemo(() => {
    const options = [];

    for (let offset = 0; offset < 2; offset++) {
      const date = new Date(currentYear, currentMonth - 1 - offset, 1);

      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0",
        )}`,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
    }

    return options;
  }, [currentYear, currentMonth]);

  /*
    Selected period:
    YYYY-MM
  */
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}`,
  );

  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const [days, setDays] = useState([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [leaveMap, setLeaveMap] = useState({});

  const token = localStorage.getItem("token");

  /* =========================================================
     SELECTED YEAR / MONTH
  ========================================================= */

  const [selectedYear, selectedMonth] = selectedPeriod.split("-").map(Number);

  /* =========================================================
     AVAILABLE WEEKS FOR SELECTED MONTH
  ========================================================= */

  const availableWeeks = useMemo(() => {
    return getWeeksForMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  /* =========================================================
     KEEP SELECTED WEEK VALID WHEN MONTH CHANGES
  ========================================================= */

  useEffect(() => {
    if (!availableWeeks.length) {
      return;
    }

    if (!availableWeeks.includes(Number(selectedWeek))) {
      setSelectedWeek(availableWeeks[availableWeeks.length - 1]);
    }
  }, [selectedYear, selectedMonth, availableWeeks, selectedWeek]);

  /* =========================================================
     CREATE WEEK DAYS
  ========================================================= */

  const createWeekDays = (
    yearValue = selectedYear,
    monthValue = selectedMonth,
    weekValue = selectedWeek,
    currentLeaveMap = leaveMap,
  ) => {
    if (!weekValue) {
      return [];
    }

    const monday = getMondayOfISOWeek(Number(weekValue), Number(yearValue));

    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);

      date.setDate(monday.getDate() + i);

      /*
        IMPORTANT:
        Only show dates belonging to selected month/year.

        Therefore:
        Week 35 August 2026:
        24,25,26,27,28,29,30

        Week crossing month:
        only dates from selected month are displayed.
      */
      if (
        date.getFullYear() !== Number(yearValue) ||
        date.getMonth() + 1 !== Number(monthValue)
      ) {
        continue;
      }

      const dateKey = formatDateKey(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );

      const lockingLeave = currentLeaveMap[dateKey];

      weekDays.push({
        date: dateKey,

        displayDate: `${String(date.getDate()).padStart(2, "0")}/${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}/${date.getFullYear()}`,

        day: date.toLocaleDateString("en-US", {
          weekday: "long",
        }),

        week: getISOWeek(date),

        worked: false,

        hours: 0,

        /*
          Approved normal leave = locked.
        */
        locked: Boolean(lockingLeave),

        leaveType: lockingLeave || "",
      });
    }

    return weekDays;
  };

  /* =========================================================
     LOAD LEAVES
  ========================================================= */

  const loadLeaves = async () => {
    if (!token) {
      throw new Error("Authentication token not found.");
    }

    const response = await fetch("/api/leave/my-leaves", {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid leave response (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(
        data?.message || `Failed to load leaves. Status: ${response.status}`,
      );
    }

    const lockedMap = buildLockedLeaveMap(data);

    setLeaveMap(lockedMap);

    return lockedMap;
  };

  /* =========================================================
     LOAD ATTENDANCE + LEAVES
  ========================================================= */

  const loadHours = async () => {
    if (!token) {
      alert("Authentication token not found.");
      return;
    }

    try {
      setLoading(true);

      /*
        Load leaves first.
        This is important because the generated days
        need to know which dates are locked.
      */
      let currentLeaveMap = {};

      try {
        currentLeaveMap = await loadLeaves();
      } catch (leaveError) {
        console.log("LOAD LEAVES FAILED:", leaveError);

        /*
          Do not stop attendance from loading
          if leave API temporarily fails.
        */

        currentLeaveMap = {};
        setLeaveMap({});
      }

      const weekDays = createWeekDays(
        selectedYear,
        selectedMonth,
        selectedWeek,
        currentLeaveMap,
      );

      const url =
        `/api/attendance?year=${selectedYear}` +
        `&month=${selectedMonth}` +
        `&week=${selectedWeek}`;

      console.log("Loading attendance from:", url);

      const response = await fetch(url, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();

      console.log("Attendance response status:", response.status);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned invalid response (${response.status}): ${responseText}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load attendance. Status: ${response.status}`,
        );
      }

      const savedAttendance = Array.isArray(data) ? data : [];

      /*
        Make fast lookup:
        {
          "2026-08-25": {...}
        }
      */
      const attendanceLookup = {};

      savedAttendance.forEach((item) => {
        const normalizedDate = normalizeApiDate(item.attendanceDate);

        if (!normalizedDate) {
          return;
        }

        attendanceLookup[normalizedDate] = item;
      });

      /*
        Merge attendance with generated days.

        LOCKED LEAVE ALWAYS WINS.

        Even if old attendance exists for
        an approved leave date, we display:

        worked = false
        hours = 0
        locked = true
      */
      const mergedDays = weekDays.map((day) => {
        const saved = attendanceLookup[day.date];

        if (day.locked) {
          return {
            ...day,

            worked: false,

            hours: 0,

            locked: true,

            leaveType:
              currentLeaveMap[day.date] || day.leaveType || "Approved Leave",
          };
        }

        if (saved) {
          return {
            ...day,

            worked:
              saved.worked === true ||
              saved.worked === 1 ||
              saved.worked === "1" ||
              saved.worked === "true",

            hours: Number(saved.hours || 0),

            locked: false,

            leaveType: "",
          };
        }

        return day;
      });

      setDays(mergedDays);

      console.log("FINAL DAYS:", mergedDays);
    } catch (error) {
      console.log("LOAD HOURS FAILED:", error);

      /*
        Even if attendance fails,
        keep leave locks visible.
      */
      const fallbackDays = createWeekDays(
        selectedYear,
        selectedMonth,
        selectedWeek,
        leaveMap,
      );

      setDays(fallbackDays);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD WHEN FILTER CHANGES
  ========================================================= */

  useEffect(() => {
    loadHours();
  }, [selectedPeriod, selectedWeek]);

  /* =========================================================
     CHANGE MONTH
  ========================================================= */

  const handlePeriodChange = (event) => {
    const newPeriod = event.target.value;

    setSelectedPeriod(newPeriod);

    const [newYear, newMonth] = newPeriod.split("-").map(Number);

    const weeks = getWeeksForMonth(newYear, newMonth);

    /*
      If selecting current month,
      keep current week if available.
    */
    if (
      newYear === currentYear &&
      newMonth === currentMonth &&
      weeks.includes(currentWeek)
    ) {
      setSelectedWeek(currentWeek);
    } else if (weeks.length) {
      /*
        For previous month, select the latest
        available week in that month.
      */
      setSelectedWeek(weeks[weeks.length - 1]);
    }
  };

  /* =========================================================
     CURRENT WEEK
  ========================================================= */

  const handleCurrentWeek = () => {
    const currentDate = new Date();

    const year = currentDate.getFullYear();

    const month = currentDate.getMonth() + 1;

    const week = getISOWeek(currentDate);

    setSelectedPeriod(`${year}-${String(month).padStart(2, "0")}`);

    setSelectedWeek(week);
  };

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
          Approved leave cannot be changed.
        */
        if (day.locked) {
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
          Approved leave cannot be changed.
        */
        if (day.locked) {
          return day;
        }

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
    return days.filter((day) => day.locked).length;
  }, [days]);

  /* =========================================================
     SUBMIT HOURS
  ========================================================= */

  const handleSubmit = async () => {
    if (!token) {
      alert("Authentication token not found.");

      return;
    }

    /*
      =======================================================
      VERY IMPORTANT FIX
      =======================================================

      NEVER submit approved leave dates.

      Example:

      24 Aug -> editable
      25 Aug -> approved leave -> DO NOT SEND
      26 Aug -> approved leave -> DO NOT SEND
      27 Aug -> approved leave -> DO NOT SEND
      28 Aug -> editable

      Backend therefore receives only:

      24 Aug
      28 Aug
      =======================================================
    */

    const editableDays = days.filter((day) => !day.locked);

    if (editableDays.length === 0) {
      alert("All displayed dates are locked by approved leave.");

      return;
    }

    /* =====================================================
       VALIDATE ONLY EDITABLE DAYS
    ===================================================== */

    const invalidDay = editableDays.find(
      (day) =>
        day.worked &&
        (day.hours === "" ||
          Number(day.hours) < 0 ||
          Number(day.hours) > 24 ||
          Number.isNaN(Number(day.hours))),
    );

    if (invalidDay) {
      alert(
        `Please enter valid hours for ${invalidDay.displayDate}. Hours must be between 0 and 24.`,
      );

      return;
    }

    /* =====================================================
       BUILD PAYLOAD ONLY FROM EDITABLE DAYS
    ===================================================== */

    const submitDays = editableDays.map((day) => ({
      date: day.date,

      worked: Boolean(day.worked),

      hours: day.worked ? Number(day.hours || 0) : 0,
    }));

    const payload = {
      year: Number(selectedYear),

      month: Number(selectedMonth),

      week: Number(selectedWeek),

      days: submitDays,
    };

    console.log("SUBMIT PAYLOAD:", payload);

    /*
      Extra frontend protection:
      never allow locked date into payload.
    */
    const hasLockedDateInPayload = payload.days.some((submittedDay) =>
      days.some((day) => day.date === submittedDay.date && day.locked),
    );

    if (hasLockedDateInPayload) {
      alert("Approved leave dates cannot be submitted.");

      return;
    }

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

      console.log("SUBMIT STATUS:", response.status);

      console.log("SUBMIT RESPONSE:", responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned invalid response (${response.status}): ${responseText}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message || `Failed to submit hours. Status: ${response.status}`,
        );
      }

      alert(data?.message || "Hours submitted successfully.");

      /*
        Reload after successful save.

        This also reloads leave dates and keeps
        approved leave locked.
      */
      await loadHours();
    } catch (error) {
      /*
        Use console.log instead of console.error
        to avoid Parcel development overlay.
      */
      console.log("SUBMIT HOURS FAILED:", error);

      alert(error?.message || "Failed to submit hours.");
    } finally {
      setSaving(false);
    }
  };

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
          min-height: 100%;
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
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
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
          min-height: 140px;
          padding: 28px 24px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
        }

        .summary-card-title {
          margin-bottom: 22px;
          font-size: 18px;
          color: #111827;
        }

        .summary-card-value {
          font-size: 28px;
          font-weight: 700;
          color: #111111;
        }

        .summary-card-value.locked-value {
          color: #b45309;
        }

        .hours-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .hours-table {
          width: 100%;
          min-width: 850px;
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
          background: #fff7ed;
        }

        .worked-checkbox {
          width: 17px;
          height: 17px;
          cursor: pointer;
          accent-color: #2563eb;
        }

        .worked-checkbox:disabled {
          cursor: not-allowed;
          opacity: 0.65;
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
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
        }

        .hours-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .hours-value {
          font-weight: 600;
        }

        .leave-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 12px;
          border-radius: 20px;
          background: #ffedd5;
          color: #9a3412;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
        }

        .working-status {
          color: #16a34a;
          font-weight: 600;
        }

        .not-worked-status {
          color: #64748b;
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
          transition: background 0.2s ease, opacity 0.2s ease;
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

        .leave-info {
          margin-top: 8px;
          font-size: 12px;
          color: #9a3412;
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

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="hours-management-header">
        <h2>Hours Management</h2>

        <p>
          Mark your working days. Approved leave dates are automatically locked.
        </p>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="hours-filter-row">
        {/* MONTH */}

        <div className="hours-filter-group">
          <label>Month</label>

          <select
            className="hours-select"
            value={selectedPeriod}
            onChange={handlePeriodChange}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* WEEK */}

        <div className="hours-filter-group">
          <label>Week</label>

          <select
            className="hours-select"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
          >
            {availableWeeks.map((week) => (
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
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="summary-row">
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
          <div className="summary-card-title">Approved Leave</div>

          <div className="summary-card-value locked-value">{lockedDays}</div>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

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
                    <th>Worked</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {days.map((day, index) => (
                    <tr
                      key={day.date}
                      className={day.locked ? "leave-row" : ""}
                    >
                      <td>{day.displayDate}</td>

                      <td>{day.day}</td>

                      <td>Week {day.week}</td>

                      {/* WORKED CHECKBOX */}

                      <td>
                        <input
                          type="checkbox"
                          className="worked-checkbox"
                          checked={Boolean(day.worked)}
                          disabled={day.locked}
                          onChange={() => handleWorkedChange(index)}
                        />
                      </td>

                      {/* HOURS */}

                      <td>
                        <input
                          type="number"
                          className="hours-input"
                          min="0"
                          max="24"
                          step="0.5"
                          value={day.hours}
                          disabled={day.locked || !day.worked}
                          onChange={(e) =>
                            handleHoursChange(index, e.target.value)
                          }
                        />
                      </td>

                      {/* STATUS */}

                      <td>
                        {day.locked ? (
                          <div>
                            <span className="leave-status">
                              🔒 {day.leaveType}
                            </span>
                          </div>
                        ) : day.worked ? (
                          <span className="working-status">Worked</span>
                        ) : (
                          <span className="not-worked-status">Not Worked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* =================================================
              SUBMIT
          ================================================= */}

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
