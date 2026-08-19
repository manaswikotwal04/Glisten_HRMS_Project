import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditEmployee = () => {
  const { employeeId } = useParams(); 
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
    status: "Active",
    currentAddress: "",
    permanentAddress: "",
    bankName: "",
    accountNo: "",
    pfNo: "",
    pan: "",
    location: ""
  });

  useEffect(() => {
    if (!employeeId) return; 

    const loadEmployee = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await fetch(`/api/employee/id/${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.warn("Failed to load employee");
          return;
        }

        const data = await res.json();

        setFormData({
          name: data.name ?? "",
          employeeId: data.employeeId ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          department: data.department ?? "",
          role: data.role ?? "",
          joinDate: data.joinDate ?? "",
          salary: data.salary ?? "",
          bloodGroup: data.bloodGroup ?? "",
          status: data.status ?? "Active",
          currentAddress: data.currentAddress ?? "",
          permanentAddress: data.permanentAddress ?? "",
          bankName: data.bankName ?? "",
          accountNo: data.accountNumber ?? "",
          pfNo: data.pfNumber ?? "",
          pan: data.panNumber ?? "",
          location: data.location ?? ""
        });

      } catch (err) {
        console.error("Load employee error:", err);
        console.warn("Network error");
      }
    };

    loadEmployee();
  }, [employeeId, navigate]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleUpdate = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const payload = {
      ...formData,
      accountNumber: formData.accountNo,
      pfNumber: formData.pfNo,
      panNumber: formData.pan
    };

    delete payload.accountNo;
    delete payload.pfNo;
    delete payload.pan;

    const res = await fetch(
      `/api/employee/${employeeId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) {
      console.warn("Update failed");
      return;
    }

    console.warn("Employee Updated Successfully 🎉");
    navigate("/app/employees");
  };

  return (
    <div className="add-employee-page">
      <div className="add-employee-card">
        <h2>Edit Employee</h2>

        <form className="form-grid" onSubmit={handleUpdate}>

          {/* BASIC */}
          <div className="form-field">
            <label>Employee Name</label>
            <input name="name" value={formData.name} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Employee ID</label>
            <input value={formData.employeeId} disabled /> {/* 🔒 LOCKED */}
          </div>

          {[
            ["email", "Email"],
            ["phone", "Phone"],
            ["bloodGroup", "Blood Group"]
          ].map(([key, label]) => (
            <div className="form-field" key={key}>
              <label>{label}</label>
              <input name={key} value={formData[key]} onChange={handleChange} />
            </div>
          ))}

          {/* DROPDOWNS */}
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
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate ? formData.joinDate.substring(0, 10) : ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Annual Salary</label>
            <input type="number" name="salary" value={formData.salary} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* BANK */}
          {[
            ["bankName", "Bank Name"],
            ["accountNo", "Account Number"],
            ["pfNo", "PF Number"],
            ["pan", "PAN Number"]
          ].map(([key, label]) => (
            <div className="form-field" key={key}>
              <label>{label}</label>
              <input name={key} value={formData[key]} onChange={handleChange} />
            </div>
          ))}

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
            <button type="button" className="btn-cancel" onClick={() => navigate("/app/employees")}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditEmployee;



