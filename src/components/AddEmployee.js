import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddEmployee = () => {

  const INITIAL_FORM = {
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
    status: "Active",

    // ✅ Address
    currentAddress: "",
    permanentAddress: "",

    // ✅ Bank & statutory fields (MATCH BACKEND)
    bankName: "",
    accountNo: "",
    pfNo: "",
    pan: "",
    location: ""
  };

  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + (data.message || "Request failed"));
        return;
      }

      alert("Employee Added Successfully 🎉");
      setFormData(INITIAL_FORM);
      navigate("/app/employees");

    } catch (err) {
      console.error(err);
      alert("Server Error 🚨");
    }
  };

  return (
    <div className="add-employee-page">
      <div className="add-employee-card">

        <h2>Add New Employee</h2>
        <p className="subtitle">
          Fill out the form below to add a new employee to the system.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>

          {/* BASIC DETAILS */}
          <div className="form-field">
            <label>Employee Name</label>
            <input name="name" value={formData.name} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Employee ID</label>
            <input name="employeeId" value={formData.employeeId} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Department</label>
            <select name="department" value={formData.department} onChange={handleChange}>
              <option value="">Select</option>
              <option>Human Resources</option>
              <option>Engineering</option>
              <option>Finance</option>
              <option>Marketing</option>
            </select>
          </div>

          <div className="form-field">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="">Select</option>
              <option>Manager</option>
              <option>Developer</option>
              <option>DevOps</option>
              <option>Cloud Engineer</option>
            </select>
          </div>

          <div className="form-field">
            <label>Joining Date</label>
            <input name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Annual Salary</label>
            <input name="salary" type="number" value={formData.salary} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Blood Group</label>
            <input name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* BANK DETAILS */}
          <div className="form-field">
            <label>Bank Name</label>
            <input name="bankName" value={formData.bankName} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Account Number</label>
            <input name="accountNo" value={formData.accountNo} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>PF Number</label>
            <input name="pfNo" value={formData.pfNo} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>PAN Number</label>
            <input name="pan" value={formData.pan} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Location</label>
            <input name="location" value={formData.location} onChange={handleChange} />
          </div>

          {/* ADDRESS */}
          <div className="form-field full-width">
            <label>Current Address</label>
            <input name="currentAddress" value={formData.currentAddress} onChange={handleChange} />
          </div>

          <div className="form-field full-width">
            <label>Permanent Address</label>
            <input name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/app/employees")}>Cancel</button>
            <button type="submit" className="btn-save">Save Employee</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
