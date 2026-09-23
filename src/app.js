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
import AdminHoursManagement from "./components/AdminHoursManagement";

import EmployeeDashboard from "./components/EmployeeDashboard";
import EmployeePayslips from "./components/EmployeePayslips";
import ApplyLeave from "./components/ApplyLeave";

import AddSalaryStructure from "./components/AddSalaryStructure";
import GeneratePayslip from "./components/GeneratePayslips";
import PayrollList from "./components/PayrollList";

import AdminDocuments from "./components/AdminDocuments";
import EmployeeDocuments from "./components/EmployeeDocuments";

import ChangePassword from "./components/changepassword";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

/* =====================================================
   ROLE PROTECTION
===================================================== */

const RequireRole = ({ role, children }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  /*
   * No login token
   */
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  /*
   * No role
   */
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Wrong role
   */
  if (userRole.toLowerCase() !== role.toLowerCase()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* =====================================================
   APP LAYOUT
===================================================== */

const AppLayout = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  /*
   * User is not logged in
   */
  if (!token || !role) {
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
          width: "calc(100% - 215px)",
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
    /* =================================================
       ROOT
    ================================================= */

    {
      path: "/",
      element: <Navigate to="/login" replace />,
    },

    /* =================================================
       LOGIN
    ================================================= */

    {
      path: "/login",
      element: <LoginPage />,
    },

    /* =================================================
       FORGOT PASSWORD
    ================================================= */

    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },

    /* =================================================
       RESET PASSWORD
    ================================================= */

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

        /* =================================================
           ADMIN - EMPLOYEES
        ================================================= */

        {
          path: "employees",
          element: (
            <RequireRole role="admin">
              <Employee />
            </RequireRole>
          ),
        },

        /* =================================================
           ADMIN - ADD EMPLOYEE
        ================================================= */

        {
          path: "employees/add",
          element: (
            <RequireRole role="admin">
              <AddEmployee />
            </RequireRole>
          ),
        },

        /* =================================================
           ADMIN - EDIT EMPLOYEE
        ================================================= */

        {
          path: "employees/edit/:employeeId",
          element: (
            <RequireRole role="admin">
              <EditEmployee />
            </RequireRole>
          ),
        },

        /* =================================================
           ADMIN - LEAVE REQUESTS
        ================================================= */

        {
          path: "leave-requests",
          element: (
            <RequireRole role="admin">
              <LeaveRequests />
            </RequireRole>
          ),
        },

        /* =================================================
           ADMIN - EMPLOYEE HOURS
        ================================================= */

        {
          path: "employee-hours",
          element: (
            <RequireRole role="admin">
              <AdminHoursManagement />
            </RequireRole>
          ),
        },

        /* =================================================
           ADMIN - SALARY STRUCTURE
        ================================================= */

        {
          path: "salary-structure/add",
          element: (
            <RequireRole role="admin">
              <AddSalaryStructure />
            </RequireRole>
          ),
        },

        /* =================================================
           ADMIN - GENERATE PAYSLIP
        ================================================= */

        {
          path: "generate-payslip",
          element: (
            <RequireRole role="admin">
              <GeneratePayslip />
            </RequireRole>
          ),
        },

        /* =================================================
           ADMIN - PAYROLL LIST
        ================================================= */

        {
          path: "payroll-list",
          element: (
            <RequireRole role="admin">
              <PayrollList />
            </RequireRole>
          ),
        },

        /* =================================================
           ADMIN - DOCUMENTS
           
           IMPORTANT:
           Admin Documents has its own route.
        ================================================= */

        {
          path: "documents",
          element: (
            <RequireRole role="admin">
              <AdminDocuments />
            </RequireRole>
          ),
        },

        /* =================================================
           EMPLOYEE - DOCUMENTS
           
           IMPORTANT:
           Employee Documents has a DIFFERENT route.
        ================================================= */

        {
          path: "employee-documents",
          element: (
            <RequireRole role="employee">
              <EmployeeDocuments />
            </RequireRole>
          ),
        },

        /* =================================================
           EMPLOYEE - HOURS MANAGEMENT
        ================================================= */

        {
          path: "hours-management",
          element: (
            <RequireRole role="employee">
              <HoursManagement />
            </RequireRole>
          ),
        },

        /* =================================================
           EMPLOYEE - DASHBOARD
        ================================================= */

        {
          path: "employee-dashboard",
          element: (
            <RequireRole role="employee">
              <EmployeeDashboard />
            </RequireRole>
          ),
        },

        /* =================================================
           EMPLOYEE - APPLY LEAVE
        ================================================= */

        {
          path: "apply-leave",
          element: (
            <RequireRole role="employee">
              <ApplyLeave />
            </RequireRole>
          ),
        },

        /* =================================================
           EMPLOYEE - MY LEAVES
        ================================================= */

        {
          path: "my-leaves",
          element: (
            <RequireRole role="employee">
              <MyLeaves />
            </RequireRole>
          ),
        },

        /* =================================================
           EMPLOYEE - PAYSLIPS
        ================================================= */

        {
          path: "employee-payslips/:employeeId",
          element: (
            <RequireRole role="employee">
              <EmployeePayslips />
            </RequireRole>
          ),
        },

        /* =================================================
           EMPLOYEE - CHANGE PASSWORD
        ================================================= */

        {
          path: "change-password",
          element: (
            <RequireRole role="employee">
              <ChangePassword />
            </RequireRole>
          ),
        },

        /* =================================================
           FALLBACK INSIDE /APP
        ================================================= */

        {
          path: "*",
          element: <AppRedirect />,
        },
      ],
    },

    /* =================================================
       GLOBAL FALLBACK
    ================================================= */

    {
      path: "*",
      element: <Navigate to="/login" replace />,
    },
  ],

  /* =====================================================
     REACT ROUTER FUTURE FLAGS
  ===================================================== */

  {
    future: {
      v7_startTransition: true,
    },
  }
);

/* =====================================================
   APP REDIRECT
===================================================== */

function AppRedirect() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role.toLowerCase() === "admin") {
    return <Navigate to="/app/employees" replace />;
  }

  if (role.toLowerCase() === "employee") {
    return <Navigate to="/app/employee-dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

/* =====================================================
   ROOT RENDER
===================================================== */

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <RouterProvider router={appRouter} />
);