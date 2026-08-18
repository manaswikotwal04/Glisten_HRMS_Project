import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MyLeaves = () => {
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyLeaves = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(
        "http://localhost:5000/api/leave/my-leaves",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await res.json();

      console.log("MY LEAVES:", data);

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
        "My leaves error:",
        error
      );

      alert(
        error.message ||
          "Unable to load your leaves"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyLeaves();
  }, []);

  return (
    <div className="employee-page">

      <h2 className="page-title">
        My Leaves
      </h2>

      {loading && (
        <p style={{ padding: "20px" }}>
          Loading your leaves...
        </p>
      )}

      {!loading && leaves.length === 0 && (
        <div
          style={{
            padding: "20px",
            background: "#fff",
            borderRadius: "8px"
          }}
        >
          <p>
            You have not applied for any leave yet.
          </p>

          <button
            className="add-btn"
            onClick={() =>
              navigate("/app/apply-leave")
            }
          >
            Apply Leave
          </button>
        </div>
      )}

      {!loading && leaves.length > 0 && (
        <div className="employee-table-container">

          <table className="employee-table">

            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied On</th>
              </tr>
            </thead>

            <tbody>

              {leaves.map((leave) => (
                <tr key={leave.id}>

                  <td>
                    {leave.leaveType}
                  </td>

                  <td>
                    {leave.fromDate
                      ? new Date(
                          leave.fromDate
                        ).toLocaleDateString()
                      : "-"
                    }
                  </td>

                  <td>
                    {leave.toDate
                      ? new Date(
                          leave.toDate
                        ).toLocaleDateString()
                      : "-"
                    }
                  </td>

                  <td>
                    {leave.numberOfDays}
                  </td>

                  <td>
                    {leave.reason}
                  </td>

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

                  <td>
                    {leave.appliedOn
                      ? new Date(
                          leave.appliedOn
                        ).toLocaleDateString()
                      : "-"
                    }
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

export default MyLeaves;


