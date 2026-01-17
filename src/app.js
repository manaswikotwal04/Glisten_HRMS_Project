import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate
} from "react-router-dom";

/* ===== COMPONENTS ===== */
import Sidebar from "./components/sidebar";
import LoginPage from "./components/LoginPage";

import Employee from "./components/Employee";
import AddEmployee from "./components/AddEmployee";
import EditEmployee from "./components/EditEmployee";

import EmployeeDashboard from "./components/EmployeeDashboard";
import EmployeePayslips from "./components/EmployeePayslips";

import AddSalaryStructure from "./components/AddSalaryStructure";
import GeneratePayslip from "./components/GeneratePayslips";
import PayrollList from "./components/PayrollList";
import ChangePassword from "./components/changepassword";
/* 🔥 RESET PASSWORD */
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

/* =========================
   ROLE GUARD
========================= */
const RequireRole = ({ role, children }) => {
  const userRole = localStorage.getItem("role");

  if (!userRole || userRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* =========================
   APP LAYOUT
========================= */
const AppLayout = () => {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      {role === "admin" && <Sidebar />}
      <div className="content-area">
        <Outlet />
      </div>
    </div>
  );
};

/* =========================
   ROUTER
========================= */
const appRouter = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },

  { path: "/login", element: <LoginPage /> },

  /* PUBLIC PASSWORD ROUTES */
  { path: "/forgot-password", element: <ForgotPassword /> },

  { path: "/reset-password", element: <ResetPassword /> },

  {
    path: "/app",
    element: <AppLayout />,
    children: [

      /* ===== ADMIN ===== */

      {
        path: "employees",
        element: (
          <RequireRole role="admin">
            <Employee />
          </RequireRole>
        )
      },

      {
        path: "employees/add",
        element: (
          <RequireRole role="admin">
            <AddEmployee />
          </RequireRole>
        )
      },

      {
        path: "employees/edit/:employeeId", // ✅ CORRECT
        element: (
          <RequireRole role="admin">
            <EditEmployee />
          </RequireRole>
        )
      },

      {
        path: "salary-structure/add",
        element: (
          <RequireRole role="admin">
            <AddSalaryStructure />
          </RequireRole>
        )
      },

      {
        path: "generate-payslip",
        element: (
          <RequireRole role="admin">
            <GeneratePayslip />
          </RequireRole>
        )
      },

      {
        path: "payroll-list",
        element: (
          <RequireRole role="admin">
            <PayrollList />
          </RequireRole>
        )
      },

      /* ===== EMPLOYEE ===== */

      {
        path: "employee-dashboard",
        element: (
          <RequireRole role="employee">
            <EmployeeDashboard />
          </RequireRole>
        )
      },

      {
        path: "employee-payslips/:employeeId",
        element: (
          <RequireRole role="employee">
            <EmployeePayslips />
          </RequireRole>
        )
      },
      {
        path: "change-password",
        element: (
          <RequireRole role="employee">
            <ChangePassword />
          </RequireRole>
        )
      }
    ]
  }
]);

/* =========================
   RENDER
========================= */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={appRouter} />);
