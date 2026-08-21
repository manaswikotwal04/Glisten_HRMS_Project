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

    currentAddress: "",
    permanentAddress: "",

    bankName: "",
    accountNo: "",
    pfNo: "",
    pan: "",
    location: ""
  };

  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
const isStrongPassword = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&#]/.test(password)
  );
};

  
  const handleSubmit = async (e) => {
  e.preventDefault();

  
  if (
    formData.password.length < 8 ||
    !/[A-Z]/.test(formData.password) ||
    !/[a-z]/.test(formData.password) ||
    !/\d/.test(formData.password) ||
    !/[@$!%*?&#]/.test(formData.password)
  ) {
    alert(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    );
    return;
  }

  setLoading(true);

  try {
  
    const payload = {
      ...formData,
      accountNumber: formData.accountNo,
      pfNumber: formData.pfNo,
      panNumber: formData.pan
    };

    delete payload.accountNo;
    delete payload.pfNo;
    delete payload.pan;

    const res = await fetch("/api/employee/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to add employee");
      return;
    }

    alert("Employee Added Successfully 🎉");
    setFormData(INITIAL_FORM);
    navigate("/app/employees");

  } catch (error) {
    console.error(error);
    alert("Server Error 🚨");
  } finally {
    setLoading(false);
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

          <div className="form-field">
            <label>Employee Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Employee ID</label>
            <input name="employeeId" value={formData.employeeId} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Department</label>
            <select name="department" value={formData.department} onChange={handleChange} required>
              <option value="">Select</option>
              <option>Human Resources</option>
              <option>Engineering</option>
              <option>Finance</option>
              <option>Marketing</option>
            </select>
          </div>

          <div className="form-field">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="">Select</option>
              <option>Manager</option>
              <option>Developer</option>
              <option>DevOps</option>
              <option>Cloud Engineer</option>
            </select>
          </div>

          <div className="form-field">
            <label>Joining Date</label>
            <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Annual Salary</label>
            <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Blood Group</label>
            <input name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* BANK */}
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

          {/* ACTIONS */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/app/employees")}
            >
              Cancel
            </button>

            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Saving..." : "Save Employee"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddEmployee;



