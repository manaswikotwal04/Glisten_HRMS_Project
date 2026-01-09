import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    joinDate: "",
    salary: "",
    bloodGroup: "",
    password: "",
    status: "",
    currentAddress: "",
    permanentAddress: ""
  });

  // Load employee data
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          localStorage.clear();
          navigate("/login");
          return;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: res.statusText }));
          alert-(err.message || "Failed to load employee");
          return;
        }

        const data = await res.json();
        setFormData(data || {});
      } catch (err) {
        console.error("Load employee error:", err);
        alert("Network error — could not load employee");
      }
    };

    load();
  }, [id]);

  // Handle field change
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit update
  const handleUpdate = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.message || "Update failed");
        return;
      }

      alert("Employee Updated Successfully 🎉");
      navigate("/app/employees");
    } catch (err) {
      console.error("Update employee error:", err);
      alert("Network error — could not update employee");
    }
  };

  return (
    <div className="add-employee-page">
      <div className="add-employee-card">

        <h2>Edit Employee</h2>
        <p className="subtitle">Modify employee details and save changes.</p>

        <form className="form-grid" onSubmit={handleUpdate}>

          <div className="form-field">
            <label>Employee Name</label>
            <input name="name" value={formData.name || ""} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Employee ID</label>
            <input name="employeeId" value={formData.employeeId || ""} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input name="email" type="email" value={formData.email || ""} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Phone</label>
            <input name="phone" value={formData.phone || ""} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Department</label>
            <select name="department" value={formData.department || ""} onChange={handleChange}>
              <option>Human Resources</option>
              <option>Engineering</option>
              <option>Finance</option>
              <option>Marketing</option>
            </select>
          </div>

          <div className="form-field">
            <label>Role</label>
            <select name="role" value={formData.role || ""} onChange={handleChange}>
              <option>Manager</option>
              <option>Developer</option>
              <option>DevOps</option>
              <option>Cloud Engineer</option>
            </select>
          </div>

          <div className="form-field">
            <label>Joining Date</label>
            <input name="joinDate" type="date" value={formData.joinDate?.substring(0,10) || ""} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Annual Salary</label>
            <input name="salary" type="number" value={formData.salary || ""} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Blood Group</label>
            <input name="bloodGroup" value={formData.bloodGroup || ""} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input name="password" type="text" value={formData.password || ""} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Status</label>
            <select name="status" value={formData.status || ""} onChange={handleChange}>
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="form-field full-width">
            <label>Current Address</label>
            <input name="currentAddress" value={formData.currentAddress || ""} onChange={handleChange} />
          </div>

          <div className="form-field full-width">
            <label>Permanent Address</label>
            <input name="permanentAddress" value={formData.permanentAddress || ""} onChange={handleChange} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/app/employees")}>
              Cancel
            </button>

            <button className="btn-save" type="submit">
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
