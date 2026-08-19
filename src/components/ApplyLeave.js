import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ApplyLeave = () => {
  const navigate = useNavigate();

  // ================= GET LOGGED-IN EMPLOYEE =================

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const employeeId = user?.employeeId || "";

  // ================= FORM STATE =================

  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: ""
  });

  const [numberOfDays, setNumberOfDays] = useState(0);
  const [loading, setLoading] = useState(false);

  // ================= HANDLE INPUT =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Calculate number of days
    if (name === "fromDate" || name === "toDate") {
      const fromDate =
        name === "fromDate"
          ? value
          : formData.fromDate;

      const toDate =
        name === "toDate"
          ? value
          : formData.toDate;

      if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (end >= start) {
          const difference =
            end.getTime() - start.getTime();

          const days =
            Math.ceil(
              difference /
                (1000 * 60 * 60 * 24)
            ) + 1;

          setNumberOfDays(days);
        } else {
          setNumberOfDays(0);
        }
      }
    }
  };

  // ================= SUBMIT LEAVE =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId) {
      alert(
        "Employee ID not found. Please login again."
      );
      navigate("/login");
      return;
    }

    if (!formData.leaveType) {
      alert("Please select leave type");
      return;
    }

    if (
      !formData.fromDate ||
      !formData.toDate
    ) {
      alert("Please select leave dates");
      return;
    }

    if (
      formData.toDate <
      formData.fromDate
    ) {
      alert(
        "To Date cannot be before From Date"
      );
      return;
    }

    if (!formData.reason.trim()) {
      alert(
        "Please enter reason for leave"
      );
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        alert(
          "Session expired. Please login again."
        );
        navigate("/login");
        return;
      }

      // Keeping your existing payload
      const payload = {
        employeeId: employeeId,
        leaveType: formData.leaveType,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        numberOfDays: numberOfDays,
        reason: formData.reason,
        status: "Pending"
      };

      const res = await fetch(
        "/api/leave/apply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.message ||
            "Failed to apply for leave"
        );
        return;
      }

      alert(
        "Leave applied successfully 🎉"
      );

      // Reset form
      setFormData({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: ""
      });

      setNumberOfDays(0);

      // Go back to dashboard
      navigate(
        "/app/employee-dashboard"
      );

    } catch (error) {
      console.error(
        "Leave application error:",
        error
      );

      alert(
        "Server error. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================

  return (
  <div
    style={{
      width: "100%",
      minHeight: "100vh",
      padding: "30px",
      boxSizing: "border-box",
      background: "#f8fafc"
    }}
  >

    <div
      className="add-employee-card"
      style={{
        width: "100%",
        maxWidth: "none",
        minWidth: "0",
        boxSizing: "border-box",
        margin: "0"
      }}
    >

      

        {/* ================= HEADER ================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px"
          }}
        >

          <div>

            <h2
              style={{
                margin: 0,
                fontSize: "24px"
              }}
            >
              Apply for Leave
            </h2>

            <p className="subtitle">
              Submit your leave request to your
              administrator.
            </p>

          </div>

          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "#eef4ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px"
            }}
          >
            📅
          </div>

        </div>


    

        <form
  className="form-grid"
  onSubmit={handleSubmit}
  style={{
    width: "100%",
    boxSizing: "border-box"
  }}
>

          {/* EMPLOYEE ID */}

          <div className="form-field">

            <label>
              Employee ID
            </label>

            <input
              value={employeeId}
              disabled
            />

          </div>


          {/* LEAVE TYPE */}

          <div className="form-field">

            <label>
              Leave Type
            </label>

            <select
              name="leaveType"
              value={
                formData.leaveType
              }
              onChange={handleChange}
              required
            >

              <option value="">
                Select Leave Type
              </option>

              <option value="Casual Leave">
                Casual Leave
              </option>

              <option value="Sick Leave">
                Sick Leave
              </option>

              <option value="Earned Leave">
                Earned Leave
              </option>

              <option value="Unpaid Leave">
                Unpaid Leave
              </option>

            </select>

          </div>


          {/* FROM DATE */}

          <div className="form-field">

            <label>
              From Date
            </label>

            <input
              type="date"
              name="fromDate"
              value={
                formData.fromDate
              }
              onChange={handleChange}
              required
            />

          </div>


          {/* TO DATE */}

          <div className="form-field">

            <label>
              To Date
            </label>

            <input
              type="date"
              name="toDate"
              value={
                formData.toDate
              }
              onChange={handleChange}
              required
            />

          </div>


          {/* NUMBER OF DAYS */}

          <div className="form-field">

            <label>
              Number of Days
            </label>

            <input
              type="number"
              value={numberOfDays}
              disabled
            />

          </div>


          {/* REASON */}

          <div
            className="form-field full-width"
          >

            <label>
              Reason for Leave
            </label>

            <textarea
              name="reason"
              value={
                formData.reason
              }
              onChange={handleChange}
              placeholder="Enter reason for leave"
              rows="5"
              required
            />

          </div>


          {/* SUMMARY */}

          {numberOfDays > 0 && (

            <div
              className="full-width"
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                padding: "16px",
                background: "#f8fafc",
                border:
                  "1px solid #e5e7eb",
                borderRadius: "8px"
              }}
            >

              <div>

                <small
                  style={{
                    color: "#6b7280"
                  }}
                >
                  Leave Type
                </small>

                <div
                  style={{
                    fontWeight: 600,
                    marginTop: "4px"
                  }}
                >
                  {formData.leaveType}
                </div>

              </div>


              <div>

                <small
                  style={{
                    color: "#6b7280"
                  }}
                >
                  Duration
                </small>

                <div
                  style={{
                    fontWeight: 600,
                    marginTop: "4px"
                  }}
                >
                  {numberOfDays}{" "}
                  {numberOfDays === 1
                    ? "Day"
                    : "Days"}
                </div>

              </div>


              <div>

                <small
                  style={{
                    color: "#6b7280"
                  }}
                >
                  Status
                </small>

                <div
                  style={{
                    fontWeight: 600,
                    color: "#d97706",
                    marginTop: "4px"
                  }}
                >
                  Pending
                </div>

              </div>

            </div>

          )}


          {/* BUTTONS */}

          <div
            className="full-width"
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              gap: "12px",
              marginTop: "10px"
            }}
          >

            <button
              type="button"
              className="add-btn"
              style={{
                background: "#6b7280"
              }}
              onClick={() =>
                navigate(
                  "/app/employee-dashboard"
                )
              }
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="add-btn"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Apply Leave"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default ApplyLeave;

