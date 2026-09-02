import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  let employeeId = null;

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    employeeId = user?.employeeId || null;
  } catch {
    employeeId = null;
  }

  // ================= LOGO =================
  const glistenImg = new URL(
    "../assets/glisten.png",
    import.meta.url
  ).href;

  console.log("Logo URL:", glistenImg);

  // Show sidebar only for logged-in users
  if (!role) {
    return null;
  }

  // ================= LOGOUT =================

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) {
      return;
    }

    localStorage.clear();

    navigate("/login", {
      replace: true,
    });
  };

  // ================= HOME PATH =================

  const homePath =
    role === "admin"
      ? "/app/employees"
      : "/app/employee-dashboard";

  return (
    <>
      <style>{`
        /* =====================================================
           GLISTEN SIDEBAR
        ===================================================== */

        .glisten-sidebar {
          width: 215px;
          min-width: 215px;
          height: 100vh;

          position: sticky;
          top: 0;

          display: flex;
          flex-direction: column;

          background: #ffffff;

          border-right: 1px solid #e8ebf1;

          box-shadow: 3px 0 15px rgba(30, 41, 59, 0.05);

          overflow: hidden;

          z-index: 1000;

          box-sizing: border-box;
        }


        /* =====================================================
           LOGO AREA
        ===================================================== */

        .glisten-logo-link {
          width: 100%;

          display: block;

          text-decoration: none;

          flex-shrink: 0;

          border-bottom: 1px solid #edf0f4;
        }


        .glisten-logo {
          width: 100%;
          height: 105px;

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 10px 15px;

          box-sizing: border-box;
        }


        .glisten-logo img {
          width: 165px;
          height: 75px;

          object-fit: contain;

          display: block;
        }


        /* =====================================================
           MENU AREA
        ===================================================== */

        .glisten-menu {
          flex: 1;

          min-height: 0;

          display: flex;

          flex-direction: column;

          padding: 20px 10px 12px;

          overflow-y: auto;
          overflow-x: hidden;

          box-sizing: border-box;
        }


        /* =====================================================
           MENU TITLE
        ===================================================== */

        .glisten-menu-title {
          padding: 0 12px;

          margin-bottom: 12px;

          color: #9aa3b2;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 1px;

          text-transform: uppercase;
        }


        /* =====================================================
           MENU ITEM
        ===================================================== */

        .glisten-menu-item {
          width: 100%;
          min-height: 44px;

          display: flex;

          align-items: center;

          gap: 11px;

          padding: 0 11px;

          margin-bottom: 5px;

          border: none;

          border-radius: 10px;

          background: transparent;

          color: #596579;

          font-family: inherit;

          font-size: 12.5px;

          font-weight: 600;

          text-decoration: none;

          text-align: left;

          cursor: pointer;

          box-sizing: border-box;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }


        /* =====================================================
           ICON
        ===================================================== */

        .glisten-menu-icon {
          width: 30px;
          height: 30px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background: #f3f5f9;

          font-size: 14px;

          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }


        /* =====================================================
           HOVER
        ===================================================== */

        .glisten-menu-item:hover {
          background: #f1f5ff;

          color: #3157d5;

          transform: translateX(2px);
        }


        .glisten-menu-item:hover .glisten-menu-icon {
          background: #e2eaff;

          transform: scale(1.05);
        }


        /* =====================================================
           ACTIVE STYLE
        ===================================================== */

        .glisten-menu-item.active {
          background: #eaf0ff;

          color: #3157d5;

          font-weight: 700;

          box-shadow:
            0 3px 10px rgba(49, 87, 213, 0.06);
        }


        .glisten-menu-item.active .glisten-menu-icon {
          background: #dce6ff;
        }


        /* =====================================================
           LOGOUT
        ===================================================== */

        .glisten-logout {
          margin-top: auto !important;

          color: #d14b4b !important;

          background: #fff7f7 !important;
        }


        .glisten-logout:hover {
          background: #fff0f0 !important;

          color: #bd3e3e !important;
        }


        .glisten-logout .glisten-menu-icon {
          background: #ffe6e6;
        }


        /* =====================================================
           SCROLLBAR
        ===================================================== */

        .glisten-menu::-webkit-scrollbar {
          width: 4px;
        }


        .glisten-menu::-webkit-scrollbar-track {
          background: transparent;
        }


        .glisten-menu::-webkit-scrollbar-thumb {
          background: #d9dee7;

          border-radius: 10px;
        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 900px) {
          .glisten-sidebar {
            width: 205px;
            min-width: 205px;
          }

          .glisten-logo {
            height: 95px;
          }

          .glisten-logo img {
            width: 155px;
            height: 70px;
          }
        }


        @media (max-width: 650px) {
          .glisten-sidebar {
            width: 195px;
            min-width: 195px;
          }

          .glisten-menu {
            padding-left: 7px;
            padding-right: 7px;
          }

          .glisten-menu-item {
            font-size: 12px;

            gap: 8px;

            padding-left: 8px;
            padding-right: 8px;
          }

          .glisten-menu-icon {
            width: 28px;
            height: 28px;

            font-size: 13px;
          }
        }
      `}</style>


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="glisten-sidebar">

        {/* ================= LOGO ================= */}

        <Link
          to={homePath}
          className="glisten-logo-link"
        >
          <div className="glisten-logo">

            <img
              src={glistenImg}
              alt="Glisten Logo"

              onLoad={() => {
                console.log(
                  "Glisten logo loaded successfully"
                );
              }}

              onError={(e) => {
                console.error(
                  "Glisten logo failed:",
                  e.currentTarget.src
                );
              }}
            />

          </div>
        </Link>


        {/* ================= MENU ================= */}

        <div className="glisten-menu">

          <div className="glisten-menu-title">
            {role === "admin"
              ? "Administration"
              : "Employee Portal"}
          </div>


          {/* ================= ADMIN ================= */}

          {role === "admin" && (
            <>

              <Link
                to="/app/employees"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  👥
                </span>

                <span>
                  Employees
                </span>
              </Link>


              <Link
                to="/app/employee-hours"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  ⏱
                </span>

                <span>
                  Employee Hours
                </span>
              </Link>


              <Link
                to="/app/leave-requests"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  📋
                </span>

                <span>
                  Leave Requests
                </span>
              </Link>


              <Link
                to="/app/salary-structure/add"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  💰
                </span>

                <span>
                  Add Salary Structure
                </span>
              </Link>


              <Link
                to="/app/generate-payslip"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  📄
                </span>

                <span>
                  Generate Payslip
                </span>
              </Link>


              <Link
                to="/app/payroll-list"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  💳
                </span>

                <span>
                  Payroll List
                </span>
              </Link>


              <Link
                to="/app/documents"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  📁
                </span>

                <span>
                  Documents
                </span>
              </Link>


              <button
                type="button"
                className="glisten-menu-item glisten-logout"
                onClick={handleLogout}
              >
                <span className="glisten-menu-icon">
                  ↪
                </span>

                <span>
                  Logout
                </span>
              </button>

            </>
          )}


          {/* ================= EMPLOYEE ================= */}

          {role === "employee" && (
            <>

              <Link
                to="/app/employee-dashboard"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  🏠
                </span>

                <span>
                  Dashboard
                </span>
              </Link>


              <Link
                to="/app/apply-leave"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  📝
                </span>

                <span>
                  Apply Leave
                </span>
              </Link>


              <Link
                to="/app/my-leaves"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  📋
                </span>

                <span>
                  My Leaves
                </span>
              </Link>


              <Link
                to="/app/hours-management"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  ⏱
                </span>

                <span>
                  Hours Management
                </span>
              </Link>


              <Link
                to="/app/documents"
                className="glisten-menu-item"
              >
                <span className="glisten-menu-icon">
                  📁
                </span>

                <span>
                  Documents
                </span>
              </Link>


              {employeeId && (
                <Link
                  to={`/app/employee-payslips/${employeeId}`}
                  className="glisten-menu-item"
                >
                  <span className="glisten-menu-icon">
                    💵
                  </span>

                  <span>
                    My Payslips
                  </span>
                </Link>
              )}


              <button
                type="button"
                className="glisten-menu-item glisten-logout"
                onClick={handleLogout}
              >
                <span className="glisten-menu-icon">
                  ↪
                </span>

                <span>
                  Logout
                </span>
              </button>

            </>
          )}

        </div>

      </aside>
    </>
  );
};

export default Sidebar;