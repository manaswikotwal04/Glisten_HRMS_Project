import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LeaveRequests = () => {
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // =====================================================
  // GET ALL LEAVE REQUESTS
  // =====================================================

  const loadLeaves = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(
        "http://localhost:5000/api/leave/all",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await res.json();

      console.log("GET LEAVES:", data);

      if (!res.ok) {
        throw new Error(
          data.message ||
          `Failed to fetch leaves (${res.status})`
        );
      }

      setLeaves(
        Array.isArray(data) ? data : []
      );

    } catch (error) {
      console.error(
        "Leave fetch error:",
        error
      );

      console.warn(
        error.message ||
        "Unable to load leave requests"
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // APPROVE / REJECT LEAVE
  // =====================================================

  const updateLeaveStatus = async (id, status) => {
    try {

      const action =
        status === "Approved"
          ? "approve"
          : "reject";

      const confirmed = window.confirm(
        `Are you sure you want to ${action} this leave request?`
      );

      if (!confirmed) {
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setProcessingId(id);

      const res = await fetch(
        `http://localhost:5000/api/leave/${id}/status`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            status: status
          })
        }
      );

      const data = await res.json();

      console.log("UPDATE LEAVE:", data);

      if (!res.ok) {
        throw new Error(
          data.message ||
          `Failed to update leave (${res.status})`
        );
      }

      console.warn(
        status === "Approved"
          ? "Leave approved successfully"
          : "Leave rejected successfully"
      );

      // Refresh the table
      await loadLeaves();

    } catch (error) {

      console.error(
        "Update leave error:",
        error
      );

      console.warn(
        error.message ||
        "Unable to update leave"
      );

    } finally {
      setProcessingId(null);
    }
  };


  // =====================================================
  // LOAD WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {
    loadLeaves();
  }, []);


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="employee-page">

      <h2 className="page-title">
        Leave Requests
      </h2>


      {/* ================= LOADING ================= */}

      {loading && (
        <p style={{ padding: "20px" }}>
          Loading leave requests...
        </p>
      )}


      {/* ================= NO DATA ================= */}

      {!loading && leaves.length === 0 && (
        <p style={{ padding: "20px" }}>
          No leave requests found.
        </p>
      )}


      {/* ================= TABLE ================= */}

      {!loading && leaves.length > 0 && (

        <div className="employee-table-container">

          <table className="employee-table">

            <thead>

              <tr>

                <th>
                  Employee ID
                </th>

                <th>
                  Employee Name
                </th>

                <th>
                  Leave Type
                </th>

                <th>
                  From Date
                </th>

                <th>
                  To Date
                </th>

                <th>
                  Days
                </th>

                <th>
                  Reason
                </th>

                <th>
                  Status
                </th>

                <th>
                  Applied On
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {leaves.map((leave) => (

                <tr key={leave.id}>

                  {/* EMPLOYEE ID */}

                  <td>
                    {leave.employeeId}
                  </td>


                  {/* EMPLOYEE NAME */}

                  <td>
                    {leave.employeeName}
                  </td>


                  {/* LEAVE TYPE */}

                  <td>
                    {leave.leaveType}
                  </td>


                  {/* FROM DATE */}

                  <td>
                    {leave.fromDate
                      ? new Date(
                          leave.fromDate
                        ).toLocaleDateString()
                      : "-"
                    }
                  </td>


                  {/* TO DATE */}

                  <td>
                    {leave.toDate
                      ? new Date(
                          leave.toDate
                        ).toLocaleDateString()
                      : "-"
                    }
                  </td>


                  {/* DAYS */}

                  <td>
                    {leave.numberOfDays}
                  </td>


                  {/* REASON */}

                  <td>
                    {leave.reason}
                  </td>


                  {/* STATUS */}

                  <td>

                    <span
                      className={
                        `leave-status ${
                          leave.status?.toLowerCase()
                        }`
                      }
                    >
                      {leave.status}
                    </span>

                  </td>


                  {/* APPLIED ON */}

                  <td>
                    {leave.appliedOn
                      ? new Date(
                          leave.appliedOn
                        ).toLocaleDateString()
                      : "-"
                    }
                  </td>


                  {/* ACTION */}

                  <td>

                    {leave.status === "Pending" ? (

                      <div
                        style={{
                          display: "flex",
                          gap: "8px"
                        }}
                      >

                        {/* APPROVE */}

                        <button
                          type="button"
                          onClick={() =>
                            updateLeaveStatus(
                              leave.id,
                              "Approved"
                            )
                          }
                          disabled={
                            processingId === leave.id
                          }
                          style={{
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            padding: "7px 12px",
                            borderRadius: "5px",
                            cursor:
                              processingId === leave.id
                                ? "not-allowed"
                                : "pointer"
                          }}
                        >
                          {processingId === leave.id
                            ? "..."
                            : "Approve"}
                        </button>


                        {/* REJECT */}

                        <button
                          type="button"
                          onClick={() =>
                            updateLeaveStatus(
                              leave.id,
                              "Rejected"
                            )
                          }
                          disabled={
                            processingId === leave.id
                          }
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "7px 12px",
                            borderRadius: "5px",
                            cursor:
                              processingId === leave.id
                                ? "not-allowed"
                                : "pointer"
                          }}
                        >
                          {processingId === leave.id
                            ? "..."
                            : "Reject"}
                        </button>

                      </div>

                    ) : (

                      <span>
                        {leave.status}
                      </span>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
};

export default LeaveRequests;
