import React, { useEffect, useState } from "react";
import glisten from "../assets/glisten.png";
import { Link } from "react-router-dom";

const Sidebar = () => {

  
  const [imgStatus, setImgStatus] = useState("idle");
 

  // compute a reliable image URL: prefer imported string, fallback to new URL()
  let imageSrc = glisten;
  try {
    if (!imageSrc || typeof imageSrc !== "string") {
      imageSrc = new URL("../assets/glisten.png", import.meta.url).href;
    }
  } catch (e) {
    console.log("image URL fallback error:", e);
  }

  useEffect(() => {
    if (!imageSrc) {
      setImgStatus("no-src");
      return;
    }
    const tester = new Image();
    tester.onload = () => setImgStatus("loaded");
    tester.onerror = () => setImgStatus("error");
    tester.src = imageSrc;
  }, [imageSrc]);

  return (
    <div className="sidebar">

      <div className="logo">
        <img
          src={imageSrc}
          alt="Glisten Logo"
          onError={(e) => {
            console.log("img load error:", e);
            e.currentTarget.style.display = "none";
          }}
        />
        
      </div>

      <div className="menu">
  <Link to="/app/employee-dashboard" className="menu-item">Dashboard</Link>
  <Link to="/app/employees" className="menu-item">Employees</Link>
  <Link to="/app/payroll" className="menu-item">Payroll / Salary Slips</Link>
  <Link to="/app/attendance" className="menu-item">Attendance</Link>
  <Link to="/app/settings" className="menu-item">Settings</Link>
</div>


    </div>
  );
};

export default Sidebar;
