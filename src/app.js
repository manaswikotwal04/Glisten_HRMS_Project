import React from "react";
import ReactDOM from "react-dom/client";

import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";

/* ===== COMPONENTS ===== */

import Sidebar from "./components/sidebar";
import LoginPage from "./components/LoginPage";
import HoursManagement from "./components/HoursManagement";
import MyLeaves from "./components/MyLeaves";
import Employee from "./components/Employee";
import AddEmployee from "./components/AddEmployee";
import EditEmployee from "./components/EditEmployee";
import LeaveRequests from "./components/LeaveRequests";
import AdminHoursManagement
  from "./components/AdminHoursManagement";
import EmployeeDashboard from "./components/EmployeeDashboard";
import EmployeePayslips from "./components/EmployeePayslips";
import ApplyLeave from "./components/ApplyLeave";

import AddSalaryStructure from "./components/AddSalaryStructure";
import GeneratePayslip from "./components/GeneratePayslips";
import PayrollList from "./components/PayrollList";

import ChangePassword from "./components/changepassword";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

/* =====================================================
   ROLE PROTECTION
===================================================== */

const RequireRole = ({ role, children }) => {
  const userRole = localStorage.getItem("role");

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* =====================================================
   APP LAYOUT
===================================================== */

const AppLayout = () => {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
      }}
    >
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          width: "calc(100% - 250px)",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

/* =====================================================
   ROUTER
===================================================== */

const appRouter = createBrowserRouter(
  [
    /* ================= ROOT ================= */

    {
      path: "/",
      element: <Navigate to="/login" replace />,
    },

    /* ================= LOGIN ================= */

    {
      path: "/login",
      element: <LoginPage />,
    },

    /* ================= FORGOT PASSWORD ================= */

    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },

    /* ================= RESET PASSWORD ================= */

    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    
    /* =================================================
       APPLICATION
    ================================================= */

    {
      path: "/app",

      element: <AppLayout />,

      children: [
        /* ================= ADMIN ================= */

        {
          path: "employees",

          element: (
            <RequireRole role="admin">
              <Employee />
            </RequireRole>
          ),
        },

        {
          path: "employees/add",

          element: (
            <RequireRole role="admin">
              <AddEmployee />
            </RequireRole>
          ),
        },
        {
  path: "hours-management",
  element: (
    <RequireRole role="employee">
      <HoursManagement />
    </RequireRole>
  )
},

        {
          path: "employees/edit/:employeeId",

          element: (
            <RequireRole role="admin">
              <EditEmployee />
            </RequireRole>
          ),
        },

        /* ================= ADMIN LEAVE ================= */

        {
          path: "leave-requests",

          element: (
            <RequireRole role="admin">
              <LeaveRequests />
            </RequireRole>
          ),
        },
        {
  path: "employee-hours",
  element: (
    <RequireRole role="admin">
      <AdminHoursManagement />
    </RequireRole>
  )
},
        /* ================= SALARY ================= */

        {
          path: "salary-structure/add",

          element: (
            <RequireRole role="admin">
              <AddSalaryStructure />
            </RequireRole>
          ),
        },

        /* ================= PAYSLIP ================= */

        {
          path: "generate-payslip",

          element: (
            <RequireRole role="admin">
              <GeneratePayslip />
            </RequireRole>
          ),
        },

        /* ================= PAYROLL ================= */

        {
          path: "payroll-list",

          element: (
            <RequireRole role="admin">
              <PayrollList />
            </RequireRole>
          ),
        },

        

        /* ================= EMPLOYEE DASHBOARD ================= */

        {
          path: "employee-dashboard",

          element: (
            <RequireRole role="employee">
              <EmployeeDashboard />
            </RequireRole>
          ),
        },

        /* ================= APPLY LEAVE ================= */

        {
          path: "apply-leave",

          element: (
            <RequireRole role="employee">
              <ApplyLeave />
            </RequireRole>
          ),
        },

        /* ================= MY LEAVES ================= */

        {
          path: "my-leaves",

          element: (
            <RequireRole role="employee">
              <MyLeaves />
            </RequireRole>
          ),
        },

        /* ================= EMPLOYEE PAYSLIPS ================= */

        {
          path: "employee-payslips/:employeeId",

          element: (
            <RequireRole role="employee">
              <EmployeePayslips />
            </RequireRole>
          ),
        },

        /* ================= CHANGE PASSWORD ================= */

        {
          path: "change-password",

          element: (
            <RequireRole role="employee">
              <ChangePassword />
            </RequireRole>
          ),
        },
      ],
    },
  ],

  /* =====================================================
     REACT ROUTER FUTURE FLAGS
  ===================================================== */

  {
    future: {
      v7_startTransition: true,
    },
  },
);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<RouterProvider router={appRouter} />);


