import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate
} from "react-router-dom";

import Sidebar from "./components/sidebar.js";
import LoginPage from "./components/LoginPage.js";

import Employee from "./components/Employee.js";
import AddEmployee from "./components/AddEmployee.js";
import EditEmployee from "./components/EditEmployee.js";

import Payroll from "./components/Payroll.js";
import GenerateSalarySlip from "./components/generatesalaryslip.js";

import EmployeeDashboard from "./components/EmployeeDashboard.js";
import EmployeePayslips from "./components/EmployeePayslips.js";


// ⭐ ONE LAYOUT — Sidebar only for ADMIN ⭐
const AppLayout = () => {
  const role = localStorage.getItem("role");

  // If user refreshes page without login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar visible ONLY for admin */}
      {role === "admin" && <Sidebar />}

      <div className="content-area">
        <Outlet />
      </div>
    </div>
  );
};


// ⭐ ROUTES ⭐
const appRouter = createBrowserRouter([

  // DEFAULT → redirect to login
  {
    path: "/",
    element: <Navigate to="/login" replace />
  },

  // LOGIN PAGE
  {
    path: "/login",
    element: <LoginPage />
  },

  // MAIN APPLICATION (after login)
  {
    path: "/app",
    element: <AppLayout />,
    children: [

      // ========= ADMIN PAGES =========
      { path: "employees", element: <Employee /> },
      { path: "employees/add", element: <AddEmployee /> },
      { path: "employees/edit/:id", element: <EditEmployee /> },

      { path: "payroll", element: <Payroll /> },
      { path: "payroll/generate", element: <GenerateSalarySlip /> },

      // ========= EMPLOYEE PAGES =========
      { path: "employee-dashboard", element: <EmployeeDashboard /> },

      // 👇 NEW — EMPLOYEE PAYSLIPS PAGE
      { path: "employee-payslips/:id", element: <EmployeePayslips /> }
    ]
  }
]);


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={appRouter} />);
