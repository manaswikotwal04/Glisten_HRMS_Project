import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Employee = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  /* ================= LOAD EMPLOYEES ================= */
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const url = showInactive
        ? "http://localhost:5000/api/employee/inactive"
        : "http://localhost:5000/api/employee";

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        alert("Session expired — please login again");
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch employees error:", err);
      alert("Network error — could not reach backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  /* ================= SOFT DELETE ================= */
  const deleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to deactivate this employee?"))
      return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/employee/${employeeId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error();

      alert("Employee deactivated successfully");
      loadEmployees();
    } catch {
      alert("Deactivate failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= HARD DELETE ================= */
  const hardDeleteEmployee = async (employeeId) => {
    if (
      !window.confirm(
        "This will permanently delete the employee. This action cannot be undone. Continue?"
      )
    )
      return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/employee/hard/${employeeId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error();

      alert("Employee permanently deleted");
      loadEmployees();
    } catch {
      alert("Permanent delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= SEARCH ================= */
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employee-page">
      <h2 className="page-title">Employee List</h2>

      <div className="filters-row">
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show Inactive Employees
        </label>

        <button
          type="button"
          className="add-btn"
          onClick={() => navigate("/app/employees/add")}
        >
          + Add Employee
        </button>
      </div>

      <div className="employee-card">
        {loading ? (
          <p style={{ padding: 20 }}>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p style={{ padding: 20 }}>No employees found.</p>
        ) : (
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.employeeId}>
                  <td>{emp.employeeId}</td>
                  <td>{emp.name}</td>
                  <td>{emp.department}</td>
                  <td>{emp.role}</td>
                  <td>{emp.email}</td>
                  <td>
                    <span className={`status-${emp.status?.toLowerCase()}`}>
                      {emp.status}
                    </span>
                  </td>

                  <td className="action-cell">
                    {/* EDIT */}
                    <button
                      type="button"
                      className="icon-btn edit"
                      title="Edit Employee"
                      onClick={() =>
                        navigate(`/app/employees/edit/${emp.employeeId}`)
                      }
                    >
                      ✏️
                    </button>

                    {/* DEACTIVATE */}
                    {emp.status === "Active" && (
                      <button
                        type="button"
                        className="icon-btn delete"
                        title="Deactivate Employee"
                        disabled={actionLoading}
                        onClick={() => deleteEmployee(emp.employeeId)}
                      >
                        🗑
                      </button>
                    )}

                    {/* HARD DELETE */}
                    {emp.status === "Inactive" && (
                      <button
                        type="button"
                        className="icon-btn danger"
                        title="Delete Permanently"
                        disabled={actionLoading}
                        onClick={() => hardDeleteEmployee(emp.employeeId)}
                      >
                        ❌
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Employee;
