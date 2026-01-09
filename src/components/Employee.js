import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Employee = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  // ▶ Fetch Employees (with Token)
  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch("http://localhost:5000/api/employees", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        alert("Session expired — please login again");
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        alert(err.message || "Failed to fetch employees");
        return;
      }

      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch employees error:", err);
      alert("Network error — could not reach backend");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // ▶ Delete Employee
  const deleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      alert("Employee Deleted Successfully");
      loadEmployees();
    } else {
      alert("Delete failed");
    }
  };

  // ▶ Status Badge
  const statusLabel = (s) => {
    switch (s) {
      case "first_login_pending": return { text: "Pending", cls: "status-pending" };
      case "active": return { text: "Active", cls: "status-active" };
      case "inactive": return { text: "Inactive", cls: "status-inactive" };
      case "on_leave": return { text: "On Leave", cls: "status-leave" };
      default: return { text: s, cls: "" };
    }
  };

  // ▶ Search Filter
  const filteredEmployees = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
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

        <button
          className="add-btn"
          onClick={() => navigate("/app/employees/add")}
        >
          + Add Employee
        </button>
      </div>

      <div className="employee-card">
        <table className="employee-table">
          <thead>
            <tr>
              <th></th>
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
            {filteredEmployees.map(emp => {
              const s = statusLabel(emp.status);

              return (
                <tr key={emp._id}>
                  <td><input type="checkbox" /></td>

                  <td>{emp.employeeId}</td>
                  <td>{emp.name}</td>
                  <td>{emp.department}</td>
                  <td>{emp.role}</td>
                  <td>{emp.email}</td>

                  <td>
                    <span className={`status-badge ${s.cls}`}>{s.text}</span>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() =>
                          navigate(`/app/employees/edit/${emp._id}`)
                        }
                      >
                        ✏ Edit
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => deleteEmployee(emp._id)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default Employee;
